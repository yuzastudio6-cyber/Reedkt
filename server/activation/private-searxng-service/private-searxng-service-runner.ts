import { execFile } from 'node:child_process'
import { randomBytes, createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { getApprovedPrivateSearxngServiceEvidence } from './approved-private-searxng-service-evidence'
import { buildPrivateSearxngDeployEnvVars } from './private-searxng-service-config'
import { validatePrivateSearxngEndpoint } from './private-searxng-endpoint-validator'
import { runPrivateSearxngControlledQuery } from './private-searxng-query-runner'
import { normalizePrivateSearxngResults } from './private-searxng-result-normalizer'
import { PRIVATE_SEARXNG_LOCAL_REPORT_PATH, privateSearxngServiceEvidenceToTypeScript } from './private-searxng-report-builder'
import { buildPrivateSearxngServicePlan } from './private-searxng-service-plan'
import {
  makePrivateSearxngRunId,
  privateSearxngArtifactPrefix,
  privateSearxngSafetyFlags,
  privateSearxngServiceConfig,
  validatePrivateSearxngServiceExecutionEnv,
} from './private-searxng-service-policy'
import { buildPrivateSearxngQaSummary } from './private-searxng-qa-summary'
import { buildPrivateSearxngSourceManifest } from './private-searxng-source-manifest-builder'
import type {
  ApprovedPrivateSearxngServiceEvidence,
  PrivateSearxngArtifact,
  PrivateSearxngExecutionReport,
  PrivateSearxngQueryResponse,
  PrivateSearxngRuntimeMetadata,
  PrivateSearxngServiceValidation,
  PrivateSearxngSourceRecord,
} from './private-searxng-service-types'

const execFileAsync = promisify(execFile)

type CloudRunServiceDescription = {
  metadata?: {
    name?: unknown
    annotations?: Record<string, unknown>
  }
  status?: {
    url?: unknown
  }
  spec?: {
    template?: {
      spec?: {
        serviceAccountName?: unknown
      }
    }
  }
}

export async function runPrivateSearxngServiceValidation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49F private SearXNG service validation.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49F_RUN_ID ?? makePrivateSearxngRunId()
  const artifactPrefix = privateSearxngArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49f-private-searxng-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const plan = buildPrivateSearxngServicePlan({ runId })
  const preflight = await runPrivateSearxngPreflight()
  const artifacts: PrivateSearxngArtifact[] = []
  let serviceValidation = plannedServiceValidation([])
  let queryResponse: PrivateSearxngQueryResponse | undefined
  let normalizedSources: PrivateSearxngSourceRecord[] = []
  let imageDigest: string | undefined
  let imageRef: string | undefined
  let queriedAt: string | undefined
  const iamChanges: string[] = []
  const blockers = [...preflight.blockers]
  const warnings = [...preflight.warnings]

  if (preflight.allowed) {
    try {
      const dockerCheck = await runCommand('docker', ['version', '--format', '{{.Server.Version}}'])
      if (!firstGcloudValue(dockerCheck)) throw new Error('Docker daemon did not return a server version.')
      const digestOutput = await runCommand('docker', ['buildx', 'imagetools', 'inspect', privateSearxngServiceConfig.officialSearxngImage])
      const officialDigest = parseDigest(digestOutput)
      if (officialDigest !== privateSearxngServiceConfig.officialSearxngIndexDigest) {
        warnings.push(`Official SearXNG image index digest changed from pinned ${privateSearxngServiceConfig.officialSearxngIndexDigest} to ${officialDigest}; Dockerfile still uses the pinned linux/amd64 digest.`)
      }
      await runCommand('docker', [
        'buildx',
        'build',
        '--platform',
        'linux/amd64',
        '--provenance=false',
        '--sbom=false',
        '-f',
        'docker/prod/private-searxng-service/Dockerfile',
        '-t',
        privateSearxngServiceConfig.targetImage,
        '--push',
        '.',
      ], 60 * 60 * 1000)
      const imageInspect = await runCommand('docker', ['buildx', 'imagetools', 'inspect', privateSearxngServiceConfig.targetImage])
      imageDigest = parseDigest(imageInspect)
      imageRef = `${privateSearxngServiceConfig.imageRepository}@${imageDigest}`
      const serviceExistsBeforeDeploy = await cloudRunServiceExists()
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
      serviceValidation = await describePrivateSearxngService(serviceExistsBeforeDeploy, imageRef, imageDigest)
      const endpointValidation = validatePrivateSearxngEndpoint({ serviceValidation })
      blockers.push(...endpointValidation.blockers)
      warnings.push(...endpointValidation.warnings)
      if (endpointValidation.allowed) {
        const serviceUrl = await describeServiceUrl()
        const identityToken = await runGcloud(['auth', 'print-identity-token', `--audiences=${serviceUrl}`])
        const query = await runPrivateSearxngControlledQuery({ serviceUrl, identityToken })
        queryResponse = query.response
        queriedAt = query.queriedAt
        blockers.push(...query.blockers)
        warnings.push(...query.warnings)
        const normalization = normalizePrivateSearxngResults({ response: queryResponse, retrievedAt: query.queriedAt })
        normalizedSources = normalization.sources
        blockers.push(...normalization.blockers)
        warnings.push(...normalization.warnings)
      }
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error))
      serviceValidation = {
        ...serviceValidation,
        blockers: [...serviceValidation.blockers, error instanceof Error ? error.message : String(error)],
      }
    }
  }

  const sourceManifest = buildPrivateSearxngSourceManifest({ runId, sources: normalizedSources, warnings, blockers })
  const runtimeMetadata: PrivateSearxngRuntimeMetadata = {
    phase: '49F',
    runId,
    serviceName: privateSearxngServiceConfig.serviceName,
    serviceMode: privateSearxngServiceConfig.serviceMode,
    image: imageRef,
    imageDigest,
    officialSearxngImage: privateSearxngServiceConfig.officialSearxngImage,
    officialSearxngIndexDigest: privateSearxngServiceConfig.officialSearxngIndexDigest,
    officialSearxngAmd64Digest: privateSearxngServiceConfig.officialSearxngAmd64Digest,
    controlledQuery: privateSearxngServiceConfig.controlledQuery,
    resultCount: normalizedSources.length,
    deployedAt: serviceValidation.deployedAt,
    queriedAt,
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

  const qa = buildPrivateSearxngQaSummary({
    phase49EEvidenceOk: preflight.phase49EEvidenceOk,
    serviceValidation,
    queryResponse,
    normalizedSources,
    sourceManifest,
    artifacts,
    preflightBlockers: blockers,
    warnings,
  })
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
    safety: {
      ...privateSearxngSafetyFlags,
      publicSearxngInstanceUsed: false,
      paidProviderCalled: false,
      browserCaptureUsed: false,
      readabilityExtractionUsed: false,
      publicAccessEnabled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...warnings, ...qa.warnings])),
  }
  artifacts.push(await uploadFile(privateSearxngServiceConfig.qaBucket, `${artifactPrefix}/reports/phase49f-report.json`, await writeJson(localRoot, 'phase49f_report', executionReport), 'private_json', 'phase49f_report'))
  executionReport.artifacts = artifacts
  await writeLocalReport(executionReport)
  const evidence = buildEvidence(executionReport, artifactPrefix)
  return {
    evidence,
    executionReport,
    localReportPath: path.join(process.cwd(), PRIVATE_SEARXNG_LOCAL_REPORT_PATH),
    iamChanges,
    evidenceModule: privateSearxngServiceEvidenceToTypeScript(evidence),
  }
}

export async function runPrivateSearxngPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let phase49EEvidenceOk = false
  try {
    const phase49E = getApprovedPrivateSearxngServiceEvidence()
    phase49EEvidenceOk = phase49E.status === 'completed'
      && phase49E.runId === privateSearxngServiceConfig.approvedPhase49ERunId
      && phase49E.blockers.length === 0
    if (!phase49EEvidenceOk) blockers.push('Approved Phase 49E evidence is missing or blocked.')
    const [activeAccount, activeProject, projectDescribe, runApi, artifactApi, artifactRepo, serviceAccount, generatedBucket, qaBucket, phase49EReport, phase49EManifest] = await Promise.all([
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
    activeAccountValue = firstGcloudValue(activeAccount)
    activeProjectValue = firstGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== privateSearxngServiceConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (firstGcloudValue(projectDescribe) !== privateSearxngServiceConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (firstGcloudValue(runApi) !== 'run.googleapis.com') blockers.push('Cloud Run API is not enabled.')
    if (firstGcloudValue(artifactApi) !== 'artifactregistry.googleapis.com') blockers.push('Artifact Registry API is not enabled.')
    if (!firstGcloudValue(artifactRepo)) blockers.push('Artifact Registry repository reeditpro-staging-workers is not reachable.')
    if (firstGcloudValue(serviceAccount) !== privateSearxngServiceConfig.serviceAccountEmail) blockers.push('Dedicated private-search service account is not reachable.')
    if (firstGcloudValue(generatedBucket) !== privateSearxngServiceConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (firstGcloudValue(qaBucket) !== privateSearxngServiceConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!firstGcloudValue(phase49EReport)) blockers.push('Approved Phase 49E report object is not reachable.')
    if (!firstGcloudValue(phase49EManifest)) blockers.push('Approved Phase 49E manifest object is not reachable.')
    await assertNoPublicBucketPrincipals([privateSearxngServiceConfig.generatedAssetsBucket, privateSearxngServiceConfig.qaBucket], blockers)
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }
  const validation = validatePrivateSearxngServiceExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
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
  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    phase49EEvidenceOk,
  }
}

async function ensurePrivateSearxngInvoker(activeAccount: string): Promise<string[]> {
  const changes: string[] = []
  const member = activeAccount.endsWith('.gserviceaccount.com') ? `serviceAccount:${activeAccount}` : `user:${activeAccount}`
  const policy = await runGcloud(['run', 'services', 'get-iam-policy', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=json'])
  if (/allUsers|allAuthenticatedUsers/.test(policy)) throw new Error('Private SearXNG Cloud Run service has public invoker IAM.')
  if (policy.includes(member) && policy.includes('roles/run.invoker')) {
    changes.push('existing:phase49f-cloud-run-invoker-active-principal')
    return changes
  }
  await runGcloud(['run', 'services', 'add-iam-policy-binding', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, `--member=${member}`, '--role=roles/run.invoker'])
  changes.push('added:phase49f-cloud-run-invoker-active-principal')
  return changes
}

async function describePrivateSearxngService(existsBeforeDeploy: boolean, image?: string, imageDigest?: string): Promise<PrivateSearxngServiceValidation> {
  const service = JSON.parse(await runGcloud(['run', 'services', 'describe', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=json'])) as CloudRunServiceDescription
  const policy = JSON.parse(jsonSlice(await runGcloud(['run', 'services', 'get-iam-policy', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=json']))) as { bindings?: Array<{ role?: string; members?: string[] }> }
  const invokerMembers = (policy.bindings ?? []).filter((binding) => binding.role === 'roles/run.invoker').flatMap((binding) => binding.members ?? [])
  const serviceUrl = String(service.status?.url ?? '')
  return {
    serviceName: privateSearxngServiceConfig.serviceName,
    existsBeforeDeploy,
    deployedOrResolved: Boolean(service.metadata?.name),
    serviceUrlRedacted: serviceUrl ? '[redacted-authenticated-cloud-run-url]' : '',
    serviceUrlHost: serviceUrl ? new URL(serviceUrl).hostname : undefined,
    publicUnauthenticatedAccess: false,
    invokerMembers,
    allUsersPresent: invokerMembers.includes('allUsers'),
    allAuthenticatedUsersPresent: invokerMembers.includes('allAuthenticatedUsers'),
    cloudRunIngress: String(service.metadata?.annotations?.['run.googleapis.com/ingress'] ?? 'all'),
    serviceAccountEmail: String(service.spec?.template?.spec?.serviceAccountName ?? privateSearxngServiceConfig.serviceAccountEmail),
    image,
    imageDigest,
    deployedAt: new Date().toISOString(),
    blockers: [],
    warnings: [],
  }
}

async function describeServiceUrl(): Promise<string> {
  const url = firstGcloudValue(await runGcloud(['run', 'services', 'describe', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=value(status.url)']))
  if (!url) throw new Error('Unable to resolve private SearXNG Cloud Run service URL.')
  return url
}

async function cloudRunServiceExists(): Promise<boolean> {
  try {
    const name = firstGcloudValue(await runGcloud(['run', 'services', 'describe', privateSearxngServiceConfig.serviceName, '--region', privateSearxngServiceConfig.region, '--project', privateSearxngServiceConfig.projectId, '--format=value(metadata.name)']))
    return name === privateSearxngServiceConfig.serviceName
  } catch {
    return false
  }
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

function buildEvidence(report: PrivateSearxngExecutionReport, artifactPrefix: string): ApprovedPrivateSearxngServiceEvidence {
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
  return {
    id,
    kind,
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: stats.size,
    sha256: sha256File(sourcePath),
  }
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

function sha256File(filePath: string): string {
  return createHash('sha256').update(readFileSync(filePath)).digest('hex')
}

function parseDigest(output: string): string {
  const digest = output.match(/Digest:\s*(sha256:[a-f0-9]{64})/)?.[1]
    ?? output.match(/(sha256:[a-f0-9]{64})/)?.[1]
  if (!digest) throw new Error('Unable to parse image digest.')
  return digest
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

function firstGcloudValue(output: string): string {
  return output.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith('WARNING:') && !line.startsWith('An error occurred:') && !line.startsWith('/')) ?? ''
}

function jsonSlice(output: string): string {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  if (start === -1 || end === -1 || end < start) return '{}'
  return output.slice(start, end + 1)
}
