import { execFile, spawn } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'
import { getApprovedPrivateWebE2EEvidence } from '../private-web-search-capture-e2e/approved-private-web-e2e-evidence'
import { validatePrivateSearxngEndpoint } from './private-searxng-endpoint-validator'
import { buildPrivateSearxngDeployEnvVars } from './private-searxng-service-config'
import { runPrivateSearxngControlledQuery } from './private-searxng-query-runner'
import { buildPrivateSearxngQaSummary } from './private-searxng-qa-summary'
import { PRIVATE_SEARXNG_LOCAL_REPORT_PATH, privateSearxngServiceEvidenceToTypeScript } from './private-searxng-report-builder'
import { normalizePrivateSearxngResults } from './private-searxng-result-normalizer'
import { buildPrivateSearxngServicePlan } from './private-searxng-service-plan'
import {
  makePrivateSearxngRunId,
  privateSearxngArtifactPrefix,
  privateSearxngSafetyFlags,
  privateSearxngServiceConfig,
  validatePrivateSearxngServiceExecutionEnv,
} from './private-searxng-service-policy'
import { buildPrivateSearxngSourceManifest } from './private-searxng-source-manifest-builder'
import type {
  ApprovedPrivateSearxngEvidence,
  PrivateSearxngArtifact,
  PrivateSearxngExecutionReport,
  PrivateSearxngQueryResponse,
  PrivateSearxngRuntimeMetadata,
  PrivateSearxngServiceValidation,
  PrivateSearxngSourceRecord,
} from './private-searxng-service-types'

const execFileAsync = promisify(execFile)

export async function runPrivateSearxngServiceValidation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49F private SearXNG service validation.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49F_RUN_ID ?? makePrivateSearxngRunId()
  const artifactPrefix = privateSearxngArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49f-private-searxng-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const plan = buildPrivateSearxngServicePlan({ runId })
  const preflight = await runPrivateSearxngPreflight()
  const blockers = [...preflight.blockers]
  const warnings = [...preflight.warnings]
  const iamChanges: string[] = []
  const artifacts: PrivateSearxngArtifact[] = []
  let serviceValidation = plannedServiceValidation([])
  let queryResponse: PrivateSearxngQueryResponse | undefined
  let normalizedSources: PrivateSearxngSourceRecord[] = []
  let imageDigest: string | undefined
  let imageRef: string | undefined
  let queriedAt: string | undefined
  let queryInvocationMethod: 'audience_identity_token' | 'default_identity_token' | 'cloud_run_proxy' | undefined

  if (preflight.allowed) {
    try {
      const dockerVersion = firstValue(await runCommand('docker', ['version', '--format', '{{.Server.Version}}']))
      if (!dockerVersion) throw new Error('Docker daemon is not running or did not return a server version.')
      const digestOutput = await runCommand('docker', ['buildx', 'imagetools', 'inspect', privateSearxngServiceConfig.officialSearxngImage])
      const officialDigest = parseDigest(digestOutput)
      if (officialDigest !== privateSearxngServiceConfig.officialSearxngIndexDigest) warnings.push(`Official SearXNG index digest changed from pinned ${privateSearxngServiceConfig.officialSearxngIndexDigest} to ${officialDigest}; Dockerfile still uses pinned linux/amd64 digest.`)
      await runCommand('docker', ['buildx', 'build', '--platform', 'linux/amd64', '--provenance=false', '--sbom=false', '-f', 'docker/prod/private-searxng-service/Dockerfile', '-t', privateSearxngServiceConfig.targetImage, '--push', '.'], 60 * 60 * 1000)
      imageDigest = parseDigest(await runCommand('docker', ['buildx', 'imagetools', 'inspect', privateSearxngServiceConfig.targetImage]))
      imageRef = `${privateSearxngServiceConfig.imageRepository}@${imageDigest}`
      const existsBeforeDeploy = await cloudRunServiceExists()
      await runCommand('gcloud', [
        'run',
        'deploy',
        privateSearxngServiceConfig.serviceName,
        '--project',
        privateSearxngServiceConfig.projectId,
        '--region',
        privateSearxngServiceConfig.region,
        '--image',
        imageRef,
        '--service-account',
        privateSearxngServiceConfig.serviceAccountEmail,
        `--cpu=${privateSearxngServiceConfig.cpu}`,
        `--memory=${privateSearxngServiceConfig.memory}`,
        `--min-instances=${privateSearxngServiceConfig.minInstances}`,
        `--max-instances=${privateSearxngServiceConfig.maxInstances}`,
        `--port=${privateSearxngServiceConfig.containerPort}`,
        '--no-allow-unauthenticated',
        '--ingress=all',
        '--set-env-vars',
        buildPrivateSearxngDeployEnvVars(randomBytes(32).toString('hex')),
      ], 20 * 60 * 1000)
      iamChanges.push(...await ensurePrivateSearxngInvoker(preflight.activeAccount))
      serviceValidation = await describePrivateSearxngService(existsBeforeDeploy, imageRef, imageDigest)
      const endpointValidation = validatePrivateSearxngEndpoint({ serviceValidation })
      blockers.push(...endpointValidation.blockers)
      warnings.push(...endpointValidation.warnings)
      if (endpointValidation.allowed) {
        const serviceUrl = await describeServiceUrl()
        let query: Awaited<ReturnType<typeof runPrivateSearxngControlledQuery>>
        try {
          const identityToken = tokenValue(await runGcloud(['auth', 'print-identity-token', `--audiences=${serviceUrl}`]))
          query = await runPrivateSearxngControlledQuery({ serviceUrl, identityToken })
          queryInvocationMethod = 'audience_identity_token'
        } catch (audienceTokenError) {
          warnings.push(`Audience-bound identity-token invocation was unavailable for the active account; trying default authenticated identity token. ${messageFromError(audienceTokenError)}`)
          try {
            const defaultIdentityToken = tokenValue(await runGcloud(['auth', 'print-identity-token']))
            query = await runPrivateSearxngControlledQuery({ serviceUrl, identityToken: defaultIdentityToken })
            queryInvocationMethod = 'default_identity_token'
          } catch (defaultTokenError) {
            warnings.push(`Default authenticated identity-token invocation was unavailable; using Cloud Run proxy fallback. ${messageFromError(defaultTokenError)}`)
            query = await runPrivateSearxngControlledQueryViaCloudRunProxy()
            queryInvocationMethod = 'cloud_run_proxy'
          }
        }
        queryResponse = query.response
        queriedAt = query.queriedAt
        blockers.push(...query.blockers)
        warnings.push(...query.warnings)
        const normalization = normalizePrivateSearxngResults({ response: queryResponse, retrievedAt: queriedAt })
        normalizedSources = normalization.sources
        blockers.push(...normalization.blockers)
        warnings.push(...normalization.warnings)
      }
    } catch (error) {
      const blocker = error instanceof Error ? error.message : String(error)
      blockers.push(blocker)
      serviceValidation = { ...serviceValidation, blockers: [...serviceValidation.blockers, blocker] }
    }
  }

  const sourceManifest = buildPrivateSearxngSourceManifest({ runId, sources: normalizedSources, warnings, blockers })
  const runtimeMetadata: PrivateSearxngRuntimeMetadata = {
    phase: '49F',
    runId,
    serviceName: privateSearxngServiceConfig.serviceName,
    image: imageRef,
    imageDigest,
    officialSearxngImage: privateSearxngServiceConfig.officialSearxngImage,
    controlledQuery: privateSearxngServiceConfig.controlledQuery,
    resultCount: normalizedSources.length,
    deployedAt: serviceValidation.deployedAt,
    queriedAt,
    queryInvocationMethod,
    iamChanges,
    warnings,
    blockers,
  }
  artifacts.push(await uploadFile(privateSearxngServiceConfig.generatedAssetsBucket, `${artifactPrefix}/plan/private-searxng-service-plan.json`, await writeJson(localRoot, 'private_searxng_service_plan', plan), 'private_json', 'private_searxng_service_plan'))
  artifacts.push(await uploadFile(privateSearxngServiceConfig.generatedAssetsBucket, `${artifactPrefix}/service/service-validation.json`, await writeJson(localRoot, 'service_validation', serviceValidation), 'private_json', 'service_validation'))
  if (queryResponse) artifacts.push(await uploadFile(privateSearxngServiceConfig.generatedAssetsBucket, `${artifactPrefix}/search/private-searxng-query-response.json`, await writeJson(localRoot, 'private_searxng_query_response', queryResponse), 'private_json', 'private_searxng_query_response'))
  artifacts.push(await uploadFile(privateSearxngServiceConfig.generatedAssetsBucket, `${artifactPrefix}/search/normalized-search-results.json`, await writeJson(localRoot, 'normalized_search_results', normalizedSources), 'private_json', 'normalized_search_results'))
  artifacts.push(await uploadFile(privateSearxngServiceConfig.generatedAssetsBucket, `${artifactPrefix}/sources/source-manifest.json`, await writeJson(localRoot, 'source_manifest', sourceManifest), 'private_json', 'source_manifest'))
  artifacts.push(await uploadFile(privateSearxngServiceConfig.generatedAssetsBucket, `${artifactPrefix}/metadata/private-searxng-runtime-metadata.json`, await writeJson(localRoot, 'private_searxng_runtime_metadata', runtimeMetadata), 'private_json', 'private_searxng_runtime_metadata'))
  const qa = buildPrivateSearxngQaSummary({ phase49EEvidenceOk: preflight.phase49EEvidenceOk, serviceValidation, queryResponse, normalizedSources, sourceManifest, artifacts, preflightBlockers: blockers, warnings })
  artifacts.push(await uploadFile(privateSearxngServiceConfig.qaBucket, `${artifactPrefix}/qa/private-searxng-service-qa.json`, await writeJson(localRoot, 'private_searxng_service_qa', qa), 'private_json', 'private_searxng_service_qa'))
  const executionReport: PrivateSearxngExecutionReport = {
    ok: qa.status === 'passed',
    phase: '49F',
    runId,
    projectId: 'reeditpro',
    region: 'us-central1',
    serviceMode: privateSearxngServiceConfig.serviceMode,
    plan,
    serviceValidation,
    queryResponse,
    normalizedSources,
    sourceManifest,
    runtimeMetadata,
    artifacts,
    qa,
    phase49GReadiness: qa.status === 'passed' ? 'ready_for_controlled_private_live_search_capture_e2e' : 'blocked',
    safety: { ...privateSearxngSafetyFlags, publicSearxngInstanceUsed: false, paidProviderCalled: false, browserCaptureUsed: false, readabilityExtractionUsed: false, publicAccessEnabled: false },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...warnings, ...qa.warnings])),
  }
  artifacts.push(await uploadFile(privateSearxngServiceConfig.qaBucket, `${artifactPrefix}/reports/phase49f-report.json`, await writeJson(localRoot, 'phase49f_report', executionReport), 'private_json', 'phase49f_report'))
  executionReport.artifacts = artifacts
  await writeLocalReport(executionReport)
  const evidence = buildEvidence(executionReport, artifactPrefix)
  return { evidence, executionReport, localReportPath: path.join(process.cwd(), PRIVATE_SEARXNG_LOCAL_REPORT_PATH), iamChanges, evidenceModule: privateSearxngServiceEvidenceToTypeScript(evidence) }
}

export async function runPrivateSearxngPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProject = ''
  let activeAccount = ''
  let phase49EEvidenceOk = false
  try {
    const phase49E = getApprovedPrivateWebE2EEvidence()
    phase49EEvidenceOk = phase49E.status === 'completed' && phase49E.runId === privateSearxngServiceConfig.approvedPhase49ERunId && phase49E.blockers.length === 0
    if (!phase49EEvidenceOk) blockers.push('Approved Phase 49E evidence is missing or blocked.')
    const [account, project, projectDescribe, runApi, artifactApi, artifactRepo, serviceAccount, generatedBucket, qaBucket, phase49EReport, phase49EManifest] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', privateSearxngServiceConfig.projectId, '--format=value(projectId)']),
      runGcloud(['services', 'list', '--enabled', '--project', privateSearxngServiceConfig.projectId, '--filter=name:run.googleapis.com', '--format=value(config.name)']),
      runGcloud(['services', 'list', '--enabled', '--project', privateSearxngServiceConfig.projectId, '--filter=name:artifactregistry.googleapis.com', '--format=value(config.name)']),
      runGcloud(['artifacts', 'repositories', 'describe', 'reeditpro-staging-workers', '--location', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=value(name)']),
      runGcloud(['iam', 'service-accounts', 'describe', privateSearxngServiceConfig.serviceAccountEmail, '--project', privateSearxngServiceConfig.projectId, '--format=value(email)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${privateSearxngServiceConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${privateSearxngServiceConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', privateSearxngServiceConfig.approvedPhase49EReportUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', privateSearxngServiceConfig.approvedPhase49EManifestUri, '--format=value(name)']),
    ])
    activeAccount = firstValue(account)
    activeProject = firstValue(project)
    if (!activeAccount) blockers.push('No active gcloud account is visible.')
    if (activeProject !== 'reeditpro') blockers.push('Active gcloud project must be exactly reeditpro.')
    if (firstValue(projectDescribe) !== 'reeditpro') blockers.push('gcloud cannot describe project reeditpro.')
    if (firstValue(runApi) !== 'run.googleapis.com') blockers.push('Cloud Run API is not enabled.')
    if (firstValue(artifactApi) !== 'artifactregistry.googleapis.com') blockers.push('Artifact Registry API is not enabled.')
    if (!firstValue(artifactRepo)) blockers.push('Artifact Registry repository reeditpro-staging-workers is not reachable.')
    if (firstValue(serviceAccount) !== privateSearxngServiceConfig.serviceAccountEmail) blockers.push('CPU worker service account is not reachable.')
    if (firstValue(generatedBucket) !== privateSearxngServiceConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (firstValue(qaBucket) !== privateSearxngServiceConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!firstValue(phase49EReport)) blockers.push('Approved Phase 49E report object is not reachable.')
    if (!firstValue(phase49EManifest)) blockers.push('Approved Phase 49E manifest object is not reachable.')
    await assertNoPublicBucketPrincipals([privateSearxngServiceConfig.generatedAssetsBucket, privateSearxngServiceConfig.qaBucket], blockers)
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }
  const validation = validatePrivateSearxngServiceExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_PRIVATE_SEARXNG_SERVICE_VALIDATION,
    paidProvidersAllowed: process.env.PAID_PROVIDERS_ALLOWED ?? 'false',
    publicSearxngInstanceAllowed: process.env.PUBLIC_SEARXNG_INSTANCE_ALLOWED ?? 'false',
    publicUnauthenticatedAccessAllowed: process.env.PUBLIC_UNAUTHENTICATED_ACCESS_ALLOWED ?? 'false',
    broadCrawlingAllowed: process.env.BROAD_CRAWLING_ALLOWED ?? 'false',
    browserCaptureAllowed: process.env.BROWSER_CAPTURE_ALLOWED ?? 'false',
    readabilityExtractionAllowed: process.env.READABILITY_EXTRACTION_ALLOWED ?? 'false',
    publicArtifactAllowed: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })
  return { allowed: blockers.length === 0 && validation.allowed, blockers: [...validation.blockers, ...blockers], warnings: [...validation.warnings, ...warnings], activeAccount, activeProject, phase49EEvidenceOk }
}

async function ensurePrivateSearxngInvoker(activeAccount: string): Promise<string[]> {
  const member = activeAccount.endsWith('.gserviceaccount.com') ? `serviceAccount:${activeAccount}` : `user:${activeAccount}`
  const policy = await runGcloud(['run', 'services', 'get-iam-policy', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=json'])
  if (/allUsers|allAuthenticatedUsers/.test(policy)) throw new Error('Private SearXNG Cloud Run service has public invoker IAM.')
  if (policy.includes(member) && policy.includes('roles/run.invoker')) return ['existing:phase49f-cloud-run-invoker-active-principal']
  await runGcloud(['run', 'services', 'add-iam-policy-binding', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, `--member=${member}`, '--role=roles/run.invoker'])
  return ['added:phase49f-cloud-run-invoker-active-principal']
}

async function describePrivateSearxngService(existsBeforeDeploy: boolean, image?: string, imageDigest?: string): Promise<PrivateSearxngServiceValidation> {
  const service = JSON.parse(jsonSlice(await runGcloud(['run', 'services', 'describe', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=json']))) as Record<string, unknown>
  const policy = JSON.parse(jsonSlice(await runGcloud(['run', 'services', 'get-iam-policy', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=json']))) as { bindings?: Array<{ role?: string; members?: string[] }> }
  const status = service.status as { url?: string } | undefined
  const metadata = service.metadata as { name?: string; annotations?: Record<string, string> } | undefined
  const spec = service.spec as { template?: { spec?: { serviceAccountName?: string } } } | undefined
  const invokerMembers = (policy.bindings ?? []).filter((binding) => binding.role === 'roles/run.invoker').flatMap((binding) => binding.members ?? [])
  const serviceUrl = status?.url ?? ''
  return {
    serviceName: privateSearxngServiceConfig.serviceName,
    existsBeforeDeploy,
    deployedOrResolved: metadata?.name === privateSearxngServiceConfig.serviceName,
    serviceUrlRedacted: serviceUrl ? '[redacted-authenticated-cloud-run-url]' : '',
    serviceUrlHost: serviceUrl ? new URL(serviceUrl).hostname : undefined,
    publicUnauthenticatedAccess: false,
    invokerMembers,
    allUsersPresent: invokerMembers.includes('allUsers'),
    allAuthenticatedUsersPresent: invokerMembers.includes('allAuthenticatedUsers'),
    cloudRunIngress: metadata?.annotations?.['run.googleapis.com/ingress'] ?? 'all',
    serviceAccountEmail: spec?.template?.spec?.serviceAccountName ?? privateSearxngServiceConfig.serviceAccountEmail,
    image,
    imageDigest,
    deployedAt: new Date().toISOString(),
    blockers: [],
    warnings: [],
  }
}

async function describeServiceUrl(): Promise<string> {
  const url = firstValue(await runGcloud(['run', 'services', 'describe', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=value(status.url)']))
  if (!url) throw new Error('Unable to resolve private SearXNG Cloud Run service URL.')
  return url
}

async function cloudRunServiceExists(): Promise<boolean> {
  try {
    return firstValue(await runGcloud(['run', 'services', 'describe', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=value(metadata.name)'])) === privateSearxngServiceConfig.serviceName
  } catch {
    return false
  }
}

async function runPrivateSearxngControlledQueryViaCloudRunProxy(): Promise<Awaited<ReturnType<typeof runPrivateSearxngControlledQuery>>> {
  const port = await getAvailableLocalPort()
  const proxy = spawn('gcloud', [
    'run',
    'services',
    'proxy',
    privateSearxngServiceConfig.serviceName,
    '--project',
    privateSearxngServiceConfig.projectId,
    '--region',
    privateSearxngServiceConfig.region,
    `--port=${port}`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
  let proxyOutput = ''
  proxy.stdout.on('data', (chunk) => {
    proxyOutput += chunk.toString()
  })
  proxy.stderr.on('data', (chunk) => {
    proxyOutput += chunk.toString()
  })
  try {
    await waitForCloudRunProxy(port, proxy, () => proxyOutput)
    return await runPrivateSearxngControlledQuery({ serviceUrl: `http://127.0.0.1:${port}` })
  } finally {
    proxy.kill('SIGTERM')
    await delay(500)
    if (proxy.exitCode === null) proxy.kill('SIGKILL')
  }
}

async function waitForCloudRunProxy(port: number, proxy: ReturnType<typeof spawn>, getOutput: () => string): Promise<void> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (proxy.exitCode !== null) throw new Error(`Cloud Run proxy exited before query could run: ${getOutput().trim() || `exit code ${proxy.exitCode}`}`)
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, { signal: AbortSignal.timeout(1_000) })
      if (response.status > 0) return
    } catch {
      await delay(1_000)
    }
  }
  throw new Error(`Cloud Run proxy did not become ready for ${privateSearxngServiceConfig.serviceName}: ${getOutput().trim()}`)
}

async function getAvailableLocalPort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (typeof address !== 'object' || address === null) {
        server.close()
        reject(new Error('Unable to reserve a local port for Cloud Run proxy.'))
        return
      }
      const port = address.port
      server.close(() => resolve(port))
    })
  })
}

function plannedServiceValidation(blockers: string[]): PrivateSearxngServiceValidation {
  return {
    serviceName: privateSearxngServiceConfig.serviceName,
    existsBeforeDeploy: false,
    deployedOrResolved: false,
    serviceUrlRedacted: 'not_deployed',
    publicUnauthenticatedAccess: false,
    invokerMembers: [],
    allUsersPresent: false,
    allAuthenticatedUsersPresent: false,
    cloudRunIngress: 'unknown',
    serviceAccountEmail: privateSearxngServiceConfig.serviceAccountEmail,
    blockers,
    warnings: [],
  }
}

function buildEvidence(report: PrivateSearxngExecutionReport, artifactPrefix: string): ApprovedPrivateSearxngEvidence {
  return {
    phase: '49F',
    status: report.ok ? 'completed' : 'blocked',
    runId: report.runId,
    serviceName: privateSearxngServiceConfig.serviceName,
    serviceMode: privateSearxngServiceConfig.serviceMode,
    image: report.runtimeMetadata.image,
    imageDigest: report.runtimeMetadata.imageDigest,
    controlledQuery: privateSearxngServiceConfig.controlledQuery,
    normalizedSourceCount: report.normalizedSources.length,
    sourceManifestUri: `gs://${privateSearxngServiceConfig.generatedAssetsBucket}/${artifactPrefix}/sources/source-manifest.json`,
    qaReportUri: `gs://${privateSearxngServiceConfig.qaBucket}/${artifactPrefix}/qa/private-searxng-service-qa.json`,
    phase49fReportUri: `gs://${privateSearxngServiceConfig.qaBucket}/${artifactPrefix}/reports/phase49f-report.json`,
    phase49GReadiness: report.phase49GReadiness,
    blockers: report.blockers,
    warnings: report.warnings,
  }
}

async function uploadFile(bucket: string, object: string, sourcePath: string, kind: PrivateSearxngArtifact['kind'], id: string): Promise<PrivateSearxngArtifact> {
  await runCommand('gcloud', ['storage', 'cp', sourcePath, `gs://${bucket}/${object}`])
  const stats = await stat(sourcePath)
  return { id, kind, bucket, object, gcsUri: `gs://${bucket}/${object}`, sizeBytes: stats.size, sha256: createHash('sha256').update(readFileSync(sourcePath)).digest('hex') }
}

async function writeJson(root: string, name: string, data: unknown): Promise<string> {
  const filePath = path.join(root, `${name}.json`)
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return filePath
}

async function writeLocalReport(report: PrivateSearxngExecutionReport): Promise<void> {
  const reportPath = path.join(process.cwd(), PRIVATE_SEARXNG_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
}

function parseDigest(output: string): string {
  const digest = output.match(/Digest:\s*(sha256:[a-f0-9]{64})/)?.[1] ?? output.match(/(sha256:[a-f0-9]{64})/)?.[1]
  if (!digest) throw new Error('Unable to parse image digest.')
  return digest
}

function messageFromError(error: unknown): string {
  return sanitizeSensitiveText(error instanceof Error ? error.message : String(error))
}

function tokenValue(output: string): string {
  const token = firstValue(output)
  if (!token || !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error(`Unable to parse identity token from gcloud output: ${sanitizeSensitiveText(output)}`)
  return token
}

function sanitizeSensitiveText(value: string): string {
  return value
    .replace(/Bearer\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 'Bearer [redacted-jwt]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
}

async function assertNoPublicBucketPrincipals(buckets: string[], blockers: string[]): Promise<void> {
  for (const bucket of buckets) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (/allUsers|allAuthenticatedUsers/.test(policy)) blockers.push(`Bucket ${bucket} has a public IAM principal.`)
  }
}

async function runGcloud(args: string[]): Promise<string> {
  return runCommand('gcloud', args)
}

async function runCommand(command: string, args: string[], timeout = 120_000): Promise<string> {
  const { stdout, stderr } = await execFileAsync(command, args, { timeout, maxBuffer: 20 * 1024 * 1024 })
  return `${stdout}${stderr ? `\n${stderr}` : ''}`
}

function firstValue(output: string): string {
  return output.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith('WARNING:') && !line.startsWith('An error occurred:') && !line.startsWith('/')) ?? ''
}

function jsonSlice(output: string): string {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  return start === -1 || end === -1 || end < start ? '{}' : output.slice(start, end + 1)
}
