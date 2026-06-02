import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'
import { getApprovedPrivateSearxngServiceEvidence } from '../private-searxng-service'
import { runAllowlistedPageCapture } from './allowlisted-page-capture-runner'
import { selectAllowlistedCaptureTargets } from './allowlisted-capture-policy'
import {
  CONTROLLED_LIVE_SEARCH_LOCAL_REPORT_PATH,
  controlledLiveSearchEvidenceToTypeScript,
} from './controlled-live-search-report-builder'
import { runPrivateSearxngLiveQueries } from './private-searxng-live-query-runner'
import { normalizeControlledLiveSearchResults } from './live-search-result-normalizer'
import { runLiveSharpPostprocess } from './live-sharp-postprocess-runner'
import { runLiveReadabilityExtraction } from './live-readability-extraction-runner'
import { buildControlledLiveSearchPlanSnapshot } from './controlled-live-search-plan'
import { buildControlledLiveSearchQaSummary } from './controlled-live-search-qa-summary'
import {
  controlledLiveSearchArtifactPrefix,
  controlledLiveSearchConfig,
  controlledLiveSearchSafetyFlags,
  makeControlledLiveSearchRunId,
  validateControlledLiveSearchCaptureE2EExecutionEnv,
} from './controlled-live-search-capture-policy'
import {
  buildControlledLiveSearchCombinedManifest,
  buildControlledLiveSearchSourceManifest,
} from './live-source-capture-extraction-manifest-builder'
import type {
  ApprovedControlledLiveSearchEvidence,
  ControlledLiveSearchArtifact,
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchExecutionReport,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchQueryResponse,
  ControlledLiveSearchSharpRecord,
  ControlledLiveSearchSourceRecord,
} from './controlled-live-search-capture-types'

const execFileAsync = promisify(execFile)

export async function runControlledLiveSearchCaptureE2E(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49G controlled private live-search/capture E2E.')
  if (process.env.REEDITPRO_CONFIRM_CONTROLLED_PRIVATE_LIVE_SEARCH_CAPTURE_E2E !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_CONTROLLED_PRIVATE_LIVE_SEARCH_CAPTURE_E2E=true is required before Phase 49G can upload artifacts.')
  }
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49G_RUN_ID ?? makeControlledLiveSearchRunId()
  const artifactPrefix = controlledLiveSearchArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49g-controlled-live-search-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const planSnapshot = buildControlledLiveSearchPlanSnapshot({ runId })
  const preflight = await runControlledLiveSearchPreflight()
  const blockers = [...preflight.blockers]
  const warnings = [...preflight.warnings]
  const artifacts: ControlledLiveSearchArtifact[] = []
  let invocationMethod: ControlledLiveSearchExecutionReport['privateSearxngInvocationMethod']
  let serviceUrlRedacted: ControlledLiveSearchExecutionReport['privateSearxngServiceUrlRedacted'] = 'unresolved'
  let queryResponses: ControlledLiveSearchQueryResponse[] = []
  let normalizedSources: ControlledLiveSearchSourceRecord[] = []
  const captureRecords: ControlledLiveSearchCaptureRecord[] = []
  const sharpRecords: ControlledLiveSearchSharpRecord[] = []
  const extractionRecords: ControlledLiveSearchExtractionRecord[] = []
  let selectedCaptureTargets = selectAllowlistedCaptureTargets({ sources: [] }).selected
  let skippedCaptureTargets = selectAllowlistedCaptureTargets({ sources: [] }).skipped

  if (preflight.allowed) {
    try {
      const serviceUrl = preflight.serviceUrl || await describeServiceUrl()
      serviceUrlRedacted = '[redacted-authenticated-cloud-run-url]'
      let query: Awaited<ReturnType<typeof runPrivateSearxngLiveQueries>>
      try {
        const identityToken = tokenValue(await runGcloud(['auth', 'print-identity-token', `--audiences=${serviceUrl}`]))
        query = await runPrivateSearxngLiveQueries({ serviceUrl, identityToken })
        invocationMethod = 'audience_identity_token'
      } catch (audienceTokenError) {
        warnings.push(`Audience-bound identity-token invocation was unavailable for the active account; trying default authenticated identity token. ${messageFromError(audienceTokenError)}`)
        try {
          const defaultIdentityToken = tokenValue(await runGcloud(['auth', 'print-identity-token']))
          query = await runPrivateSearxngLiveQueries({ serviceUrl, identityToken: defaultIdentityToken })
          invocationMethod = 'default_identity_token'
        } catch (defaultTokenError) {
          warnings.push(`Default authenticated identity-token invocation was unavailable; using Cloud Run proxy fallback. ${messageFromError(defaultTokenError)}`)
          query = await runPrivateSearxngLiveQueriesViaCloudRunProxy()
          invocationMethod = 'cloud_run_proxy'
        }
      }
      queryResponses = query.responses
      blockers.push(...query.blockers)
      warnings.push(...query.warnings)
      const normalization = normalizeControlledLiveSearchResults({ responses: queryResponses })
      normalizedSources = normalization.sources
      blockers.push(...normalization.blockers)
      warnings.push(...normalization.warnings)
      const selection = selectAllowlistedCaptureTargets({ sources: normalizedSources })
      selectedCaptureTargets = selection.selected
      skippedCaptureTargets = selection.skipped
      warnings.push(...selection.warnings)
      blockers.push(...selection.blockers)
      for (const target of selectedCaptureTargets) {
        try {
          const capture = await runAllowlistedPageCapture({ target, outputRoot: localRoot })
          captureRecords.push(capture)
          warnings.push(...capture.warnings)
          const sharpRecord = await runLiveSharpPostprocess({ capture })
          sharpRecords.push(sharpRecord)
          const extraction = await runLiveReadabilityExtraction({ capture })
          extractionRecords.push(extraction.normalized)
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          skippedCaptureTargets.push({ sourceId: target.sourceId, url: target.url, reason })
          warnings.push(`Phase 49G skipped ${target.sourceId}: ${reason}`)
        }
      }
      if (captureRecords.length === 0) blockers.push('No allowlisted Playwright capture completed successfully.')
      if (extractionRecords.length === 0) blockers.push('No allowlisted Readability extraction completed successfully.')
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error))
    }
  }

  const sourceManifest = buildControlledLiveSearchSourceManifest({ runId, sources: normalizedSources, captureRecords, extractionRecords, warnings, blockers })
  const combinedManifest = buildControlledLiveSearchCombinedManifest({
    runId,
    sources: normalizedSources,
    selectedCaptureTargets,
    skippedCaptureTargets,
    captureRecords,
    sharpRecords,
    extractionRecords,
    warnings,
    blockers,
  })

  artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-controlled-live-search-capture-plan.json`, await writeJson(localRoot, 'approved_controlled_live_search_capture_plan', planSnapshot), 'private_json', 'approved_controlled_live_search_capture_plan'))
  artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/search/private-searxng-query-responses.json`, await writeJson(localRoot, 'private_searxng_query_responses', queryResponses), 'private_json', 'private_searxng_query_responses'))
  artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/search/normalized-search-results.json`, await writeJson(localRoot, 'normalized_search_results', normalizedSources), 'private_json', 'normalized_search_results'))
  artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/sources/source-manifest.json`, await writeJson(localRoot, 'source_manifest', sourceManifest), 'private_json', 'source_manifest'))
  for (const capture of captureRecords) {
    artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/screenshot-original.png`, capture.screenshotPath, 'private_png', `${capture.sourceId}_screenshot_original`))
    const sharpRecord = sharpRecords.find((record) => record.sourceId === capture.sourceId)
    if (sharpRecord) {
      artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/screenshot-preview.png`, sharpRecord.previewPath, 'private_png', `${capture.sourceId}_screenshot_preview`))
      artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/screenshot-thumbnail.png`, sharpRecord.thumbnailPath, 'private_png', `${capture.sourceId}_screenshot_thumbnail`))
    }
    artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/capture-metadata.json`, await writeJson(localRoot, `${capture.sourceId}_capture_metadata`, capture), 'private_json', `${capture.sourceId}_capture_metadata`))
  }
  for (const extraction of extractionRecords) {
    artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${extraction.sourceId}/extracted-article-sanitized.json`, extraction.sanitizedJsonPath, 'private_json', `${extraction.sourceId}_extracted_article_sanitized`))
    artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${extraction.sourceId}/extracted-article-text.txt`, extraction.textPath, 'private_text', `${extraction.sourceId}_extracted_article_text`))
    artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${extraction.sourceId}/extraction-metadata.json`, extraction.metadataPath, 'private_json', `${extraction.sourceId}_extraction_metadata`))
  }
  artifacts.push(await uploadFile(controlledLiveSearchConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/controlled-live-search-capture-e2e-manifest.json`, await writeJson(localRoot, 'controlled_live_search_capture_e2e_manifest', combinedManifest), 'private_json', 'controlled_live_search_capture_e2e_manifest'))

  const qa = buildControlledLiveSearchQaSummary({
    phase49FEvidenceOk: preflight.phase49FEvidenceOk,
    planSnapshot,
    queryResponses,
    normalizedSources,
    sourceManifest,
    captureRecords,
    sharpRecords,
    extractionRecords,
    combinedManifest,
    artifacts,
    preflightBlockers: blockers,
    warnings,
  })
  artifacts.push(await uploadFile(controlledLiveSearchConfig.qaBucket, `${artifactPrefix}/qa/controlled-live-search-capture-e2e-qa.json`, await writeJson(localRoot, 'controlled_live_search_capture_e2e_qa', qa), 'private_json', 'controlled_live_search_capture_e2e_qa'))
  const executionReport: ControlledLiveSearchExecutionReport = {
    ok: qa.status === 'passed',
    phase: '49G',
    runId,
    projectId: 'reeditpro',
    region: 'us-central1',
    mode: controlledLiveSearchConfig.mode,
    planSnapshot,
    serviceName: controlledLiveSearchConfig.serviceName,
    privateSearxngServiceUrlRedacted: serviceUrlRedacted,
    privateSearxngInvocationMethod: invocationMethod,
    queryResponses,
    normalizedSources,
    sourceManifest,
    selectedCaptureTargets,
    skippedCaptureTargets,
    captureRecords,
    sharpRecords,
    extractionRecords,
    combinedManifest,
    artifacts,
    qa,
    phase49HReadiness: qa.status === 'passed' ? 'ready_for_web_search_capture_internal_readiness_gate' : 'blocked',
    safety: {
      ...controlledLiveSearchSafetyFlags,
      paidProviderCalled: false,
      publicSearxngInstanceUsed: false,
      arbitraryUrlCaptureUsed: false,
      publicAccessEnabled: false,
      signedUrlSourceOfTruth: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...warnings, ...qa.warnings])),
  }
  artifacts.push(await uploadFile(controlledLiveSearchConfig.qaBucket, `${artifactPrefix}/reports/phase49g-report.json`, await writeJson(localRoot, 'phase49g_report', executionReport), 'private_json', 'phase49g_report'))
  executionReport.artifacts = artifacts
  await writeLocalReport(executionReport)
  const evidence = buildEvidence(executionReport, artifactPrefix)
  return { evidence, executionReport, localReportPath: path.join(process.cwd(), CONTROLLED_LIVE_SEARCH_LOCAL_REPORT_PATH), evidenceModule: controlledLiveSearchEvidenceToTypeScript(evidence) }
}

export async function runControlledLiveSearchPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProject = ''
  let serviceUrl = ''
  let phase49FEvidenceOk = false
  try {
    const phase49F = getApprovedPrivateSearxngServiceEvidence()
    phase49FEvidenceOk = phase49F.status === 'completed' && phase49F.runId === controlledLiveSearchConfig.approvedPhase49FRunId && phase49F.phase49GReadiness === 'ready_for_controlled_private_live_search_capture_e2e' && phase49F.blockers.length === 0
    if (!phase49FEvidenceOk) blockers.push('Approved Phase 49F private SearXNG evidence is missing or blocked.')
    const [account, project, projectDescribe, serviceDescribe, servicePolicy, generatedBucket, qaBucket, phase49FReport, phase49FManifest] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', controlledLiveSearchConfig.projectId, '--format=value(projectId)']),
      runGcloud(['run', 'services', 'describe', controlledLiveSearchConfig.serviceName, '--region', controlledLiveSearchConfig.region, '--project', controlledLiveSearchConfig.projectId, '--format=json']),
      runGcloud(['run', 'services', 'get-iam-policy', controlledLiveSearchConfig.serviceName, '--region', controlledLiveSearchConfig.region, '--project', controlledLiveSearchConfig.projectId, '--format=json']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${controlledLiveSearchConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${controlledLiveSearchConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', controlledLiveSearchConfig.approvedPhase49FReportUri, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', controlledLiveSearchConfig.approvedPhase49FSourceManifestUri, '--format=value(name)']),
    ])
    activeProject = firstValue(project)
    const activeAccount = firstValue(account)
    if (!activeAccount) blockers.push('No active gcloud account is visible.')
    if (activeProject !== 'reeditpro') blockers.push('Active gcloud project must be exactly reeditpro.')
    if (firstValue(projectDescribe) !== 'reeditpro') blockers.push('gcloud cannot describe project reeditpro.')
    const service = JSON.parse(jsonSlice(serviceDescribe)) as { status?: { url?: string }; metadata?: { name?: string } }
    serviceUrl = service.status?.url ?? ''
    if (service.metadata?.name !== controlledLiveSearchConfig.serviceName || !serviceUrl) blockers.push('Private SearXNG Cloud Run service is not reachable.')
    const policy = JSON.parse(jsonSlice(servicePolicy)) as { bindings?: Array<{ role?: string; members?: string[] }> }
    const invokerMembers = (policy.bindings ?? []).filter((binding) => binding.role === 'roles/run.invoker').flatMap((binding) => binding.members ?? [])
    if (invokerMembers.includes('allUsers') || invokerMembers.includes('allAuthenticatedUsers')) blockers.push('Private SearXNG Cloud Run service has public invoker IAM.')
    if (firstValue(generatedBucket) !== controlledLiveSearchConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (firstValue(qaBucket) !== controlledLiveSearchConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    if (!firstValue(phase49FReport)) blockers.push('Approved Phase 49F report object is not reachable.')
    if (!firstValue(phase49FManifest)) blockers.push('Approved Phase 49F source manifest object is not reachable.')
    await assertNoPublicBucketPrincipals([controlledLiveSearchConfig.generatedAssetsBucket, controlledLiveSearchConfig.qaBucket], blockers)
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }
  const validation = validateControlledLiveSearchCaptureE2EExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_CONTROLLED_PRIVATE_LIVE_SEARCH_CAPTURE_E2E,
    paidProvidersAllowed: process.env.PAID_PROVIDERS_ALLOWED ?? 'false',
    publicSearxngInstanceAllowed: process.env.PUBLIC_SEARXNG_INSTANCE_ALLOWED ?? 'false',
    arbitraryUrlCaptureAllowed: process.env.ARBITRARY_URL_CAPTURE_ALLOWED ?? 'false',
    publicArtifactAllowed: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })
  return { allowed: blockers.length === 0 && validation.allowed, blockers: [...validation.blockers, ...blockers], warnings: [...validation.warnings, ...warnings], activeProject, phase49FEvidenceOk, serviceUrl }
}

async function runPrivateSearxngLiveQueriesViaCloudRunProxy(): Promise<Awaited<ReturnType<typeof runPrivateSearxngLiveQueries>>> {
  const port = await getAvailableLocalPort()
  const proxy = spawn('gcloud', [
    'run',
    'services',
    'proxy',
    controlledLiveSearchConfig.serviceName,
    '--project',
    controlledLiveSearchConfig.projectId,
    '--region',
    controlledLiveSearchConfig.region,
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
    await waitForCloudRunProxy(port, proxy, () => sanitizeSensitiveText(proxyOutput))
    return await runPrivateSearxngLiveQueries({ serviceUrl: `http://127.0.0.1:${port}` })
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
  throw new Error(`Cloud Run proxy did not become ready for ${controlledLiveSearchConfig.serviceName}: ${getOutput().trim()}`)
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

async function describeServiceUrl(): Promise<string> {
  const url = firstValue(await runGcloud(['run', 'services', 'describe', controlledLiveSearchConfig.serviceName, '--region', controlledLiveSearchConfig.region, '--project', controlledLiveSearchConfig.projectId, '--format=value(status.url)']))
  if (!url) throw new Error('Unable to resolve private SearXNG Cloud Run service URL.')
  return url
}

function buildEvidence(report: ControlledLiveSearchExecutionReport, artifactPrefix: string): ApprovedControlledLiveSearchEvidence {
  return {
    phase: '49G',
    status: report.ok ? 'completed' : 'blocked',
    runId: report.runId,
    serviceName: controlledLiveSearchConfig.serviceName,
    normalizedSourceCount: report.normalizedSources.length,
    selectedCaptureTargetCount: report.selectedCaptureTargets.length,
    successfulCaptureCount: report.captureRecords.length,
    successfulExtractionCount: report.extractionRecords.length,
    sourceManifestUri: `gs://${controlledLiveSearchConfig.generatedAssetsBucket}/${artifactPrefix}/sources/source-manifest.json`,
    combinedManifestUri: `gs://${controlledLiveSearchConfig.generatedAssetsBucket}/${artifactPrefix}/manifest/controlled-live-search-capture-e2e-manifest.json`,
    qaReportUri: `gs://${controlledLiveSearchConfig.qaBucket}/${artifactPrefix}/qa/controlled-live-search-capture-e2e-qa.json`,
    phase49gReportUri: `gs://${controlledLiveSearchConfig.qaBucket}/${artifactPrefix}/reports/phase49g-report.json`,
    phase49HReadiness: report.phase49HReadiness,
    blockers: report.blockers,
    warnings: report.warnings,
  }
}

async function uploadFile(bucket: string, object: string, sourcePath: string, kind: ControlledLiveSearchArtifact['kind'], id: string): Promise<ControlledLiveSearchArtifact> {
  await runCommand('gcloud', ['storage', 'cp', sourcePath, `gs://${bucket}/${object}`])
  const stats = await stat(sourcePath)
  return { id, kind, bucket, object, gcsUri: `gs://${bucket}/${object}`, sizeBytes: stats.size, sha256: createHash('sha256').update(readFileSync(sourcePath)).digest('hex') }
}

async function writeJson(root: string, name: string, data: unknown): Promise<string> {
  const filePath = path.join(root, `${name}.json`)
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return filePath
}

async function writeLocalReport(report: ControlledLiveSearchExecutionReport): Promise<void> {
  const reportPath = path.join(process.cwd(), CONTROLLED_LIVE_SEARCH_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
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
    .replace(/https:\/\/[A-Za-z0-9.-]+\.run\.app/g, '[redacted-authenticated-cloud-run-url]')
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
