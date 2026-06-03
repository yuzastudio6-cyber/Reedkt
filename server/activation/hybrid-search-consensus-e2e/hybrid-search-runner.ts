import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import os from 'node:os'
import path from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'
import {
  buildBraveLiveBudgetGuard,
  inspectBraveLiveSecretMetadata,
  redactBraveLiveSecretResolution,
  resolveBraveLiveSecret,
} from '../brave-live-api-validation'
import { buildHybridSearchPlanSnapshot } from './hybrid-search-plan-snapshot'
import { runHybridPrivateSearxngQuery } from './hybrid-searxng-query-runner'
import { runHybridBraveQuery } from './hybrid-brave-query-runner'
import { normalizeHybridBraveResults, normalizeHybridSearxngResults } from './hybrid-source-normalizer'
import { mergeDedupeAndRankHybridSources } from './hybrid-source-dedupe-ranker'
import { selectHybridCaptureTargets } from './hybrid-allowlisted-capture-policy'
import { buildHybridConsensusManifest } from './hybrid-consensus-manifest-builder'
import { buildHybridSearchQaSummary } from './hybrid-search-qa-summary'
import { HYBRID_SEARCH_LOCAL_REPORT_PATH, hybridSearchEvidenceToTypeScript } from './hybrid-search-report-builder'
import {
  hybridSearchArtifactPrefix,
  hybridSearchConfig,
  hybridSearchSafetyFlags,
  makeHybridSearchRunId,
  validateHybridSearchConsensusE2EEnv,
} from './hybrid-search-consensus-policy'
import type {
  BraveLiveApiCallSummary,
} from '../brave-live-api-validation'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchExtractionRecord,
  ControlledLiveSearchQueryResponse,
  ControlledLiveSearchSharpRecord,
} from '../controlled-live-search-capture-e2e'
import type {
  HybridCaptureTarget,
  HybridSearchArtifact,
  HybridSearchExecutionReport,
  HybridSkippedTarget,
} from './hybrid-search-consensus-types'

const execFileAsync = promisify(execFile)

export async function runHybridSearchConsensusE2E(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49M SearXNG + Brave hybrid consensus E2E.')
  if (process.env.REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E !== 'true') {
    throw new Error('REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E=true is required before Phase 49M can upload artifacts.')
  }
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49M_RUN_ID ?? makeHybridSearchRunId()
  const artifactPrefix = hybridSearchArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49m-hybrid-search-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const planSnapshot = buildHybridSearchPlanSnapshot(runId)
  const preflight = await runHybridSearchPreflight()
  const secret = await resolveBraveLiveSecret()
  const secretMetadata = await inspectBraveLiveSecretMetadata({ attemptMissingIamGrant: true })
  const safeSecret = redactBraveLiveSecretResolution(secret)
  const env = validateHybridSearchConsensusE2EEnv({ ...preflight.envInput, secretConfigured: secret.configured })
  const budget = buildBraveLiveBudgetGuard()
  const blockers = [...preflight.blockers, ...secret.blockers, ...secretMetadata.blockers, ...env.blockers, ...budget.blockers]
  const warnings = [...preflight.warnings, ...secret.warnings, ...secretMetadata.warnings, ...env.warnings, ...budget.warnings]

  const artifacts: HybridSearchArtifact[] = []
  let invocationMethod: HybridSearchExecutionReport['privateSearxngInvocationMethod']
  let serviceUrlRedacted: HybridSearchExecutionReport['privateSearxngServiceUrlRedacted'] = 'unresolved'
  let searxngQueryResponses: ControlledLiveSearchQueryResponse[] = []
  let braveApiCall = emptyBraveApiCall()
  let normalizedSearxngSources: HybridSearchExecutionReport['normalizedSearxngSources'] = []
  let normalizedBraveSources: HybridSearchExecutionReport['normalizedBraveSources'] = []
  let mergedSources: HybridSearchExecutionReport['mergedSources'] = []
  let duplicateGroups: HybridSearchExecutionReport['dedupeReport']['duplicateGroups'] = []
  let consensusReport = emptyConsensusReport()
  let selectedCaptureTargets: HybridCaptureTarget[] = []
  let skippedCaptureTargets: HybridSkippedTarget[] = []
  const captureRecords: ControlledLiveSearchCaptureRecord[] = []
  const sharpRecords: ControlledLiveSearchSharpRecord[] = []
  const extractionRecords: ControlledLiveSearchExtractionRecord[] = []

  if (!blockers.length && secret.secretValue) {
    try {
      const serviceUrl = preflight.serviceUrl || await describeServiceUrl()
      serviceUrlRedacted = '[redacted-authenticated-cloud-run-url]'
      let searxng: Awaited<ReturnType<typeof runHybridPrivateSearxngQuery>>
      try {
        const identityToken = tokenValue(await runGcloud(['auth', 'print-identity-token', `--audiences=${serviceUrl}`]))
        searxng = await runHybridPrivateSearxngQuery({ serviceUrl, identityToken })
        invocationMethod = 'audience_identity_token'
      } catch (audienceTokenError) {
        warnings.push(`Audience-bound identity-token invocation was unavailable; trying default authenticated identity token. ${messageFromError(audienceTokenError)}`)
        try {
          const defaultIdentityToken = tokenValue(await runGcloud(['auth', 'print-identity-token']))
          searxng = await runHybridPrivateSearxngQuery({ serviceUrl, identityToken: defaultIdentityToken })
          invocationMethod = 'default_identity_token'
        } catch (defaultTokenError) {
          warnings.push(`Default authenticated identity-token invocation was unavailable; using Cloud Run proxy fallback. ${messageFromError(defaultTokenError)}`)
          searxng = await runHybridPrivateSearxngQueryViaCloudRunProxy()
          invocationMethod = 'cloud_run_proxy'
        }
      }
      searxngQueryResponses = searxng.responses
      blockers.push(...searxng.blockers)
      warnings.push(...searxng.warnings)

      const brave = await runHybridBraveQuery({ apiKey: secret.secretValue })
      braveApiCall = brave.summary
      blockers.push(...brave.blockers)
      warnings.push(...brave.warnings)

      const searxngNormalization = normalizeHybridSearxngResults({ responses: searxngQueryResponses })
      normalizedSearxngSources = searxngNormalization.sources
      blockers.push(...searxngNormalization.blockers)
      warnings.push(...searxngNormalization.warnings)
      const braveNormalization = normalizeHybridBraveResults({ results: brave.results })
      normalizedBraveSources = braveNormalization.sources
      blockers.push(...braveNormalization.blockers)
      warnings.push(...braveNormalization.warnings)

      const consensus = mergeDedupeAndRankHybridSources({ searxngSources: normalizedSearxngSources, braveSources: normalizedBraveSources })
      mergedSources = consensus.mergedSources
      duplicateGroups = consensus.duplicateGroups
      consensusReport = consensus.consensusReport
      blockers.push(...consensus.blockers)
      warnings.push(...consensus.warnings)

      const selection = selectHybridCaptureTargets({ mergedSources })
      selectedCaptureTargets = selection.selected
      skippedCaptureTargets = selection.skipped
      blockers.push(...selection.blockers)
      warnings.push(...selection.warnings)
      for (const target of selectedCaptureTargets) {
        try {
          const { runHybridAllowlistedCapture } = await import('./hybrid-capture-runner')
          const { runHybridSharpPostprocess } = await import('./hybrid-sharp-postprocess-runner')
          const { runHybridReadabilityExtraction } = await import('./hybrid-readability-extraction-runner')
          const capture = await runHybridAllowlistedCapture({ target, outputRoot: localRoot })
          captureRecords.push(capture)
          warnings.push(...capture.warnings)
          const sharpRecord = await runHybridSharpPostprocess({ capture })
          sharpRecords.push(sharpRecord)
          const extraction = await runHybridReadabilityExtraction({ capture })
          extractionRecords.push(extraction.normalized)
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error)
          skippedCaptureTargets.push({ sourceId: target.sourceId, url: target.url, reason })
          warnings.push(`Phase 49M skipped ${target.sourceId}: ${reason}`)
        }
      }
      if (!captureRecords.length) blockers.push('No allowlisted Playwright capture completed successfully.')
      if (!extractionRecords.length) blockers.push('No allowlisted Readability extraction completed successfully.')
    } catch (error) {
      blockers.push(error instanceof Error ? error.message : String(error))
    }
  }

  const manifest = buildHybridConsensusManifest({
    runId,
    searxngSources: normalizedSearxngSources,
    braveSources: normalizedBraveSources,
    mergedSources,
    duplicateGroups,
    selectedCaptureTargets,
    skippedCaptureTargets,
    captureRecords,
    sharpRecords,
    extractionRecords,
    warnings,
    blockers,
  })

  const canUpload = preflight.uploadPreflightAllowed
  if (canUpload) {
    artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/plan/hybrid-search-consensus-plan.json`, await writeJson(localRoot, 'hybrid_search_consensus_plan', planSnapshot), 'private_json', 'hybrid_search_consensus_plan'))
    artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/searxng/searxng-normalized-sources.json`, await writeJson(localRoot, 'searxng_normalized_sources', normalizedSearxngSources), 'private_json', 'searxng_normalized_sources'))
    artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/brave/brave-normalized-sources.json`, await writeJson(localRoot, 'brave_normalized_sources', normalizedBraveSources), 'private_json', 'brave_normalized_sources'))
    artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/merged/hybrid-merged-sources.json`, await writeJson(localRoot, 'hybrid_merged_sources', mergedSources), 'private_json', 'hybrid_merged_sources'))
    artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/dedupe/hybrid-dedupe-report.json`, await writeJson(localRoot, 'hybrid_dedupe_report', { duplicateGroups, mergedSourceCount: mergedSources.length }), 'private_json', 'hybrid_dedupe_report'))
    artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/consensus/hybrid-consensus-report.json`, await writeJson(localRoot, 'hybrid_consensus_report', consensusReport), 'private_json', 'hybrid_consensus_report'))
    for (const capture of captureRecords) {
      artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/screenshot-original.png`, capture.screenshotPath, 'private_png', `${capture.sourceId}_screenshot_original`))
      const sharpRecord = sharpRecords.find((record) => record.sourceId === capture.sourceId)
      if (sharpRecord) {
        artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/screenshot-preview.png`, sharpRecord.previewPath, 'private_png', `${capture.sourceId}_screenshot_preview`))
        artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/screenshot-thumbnail.png`, sharpRecord.thumbnailPath, 'private_png', `${capture.sourceId}_screenshot_thumbnail`))
      }
      artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/captures/${capture.sourceId}/capture-metadata.json`, await writeJson(localRoot, `${capture.sourceId}_capture_metadata`, capture), 'private_json', `${capture.sourceId}_capture_metadata`))
    }
    for (const extraction of extractionRecords) {
      artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${extraction.sourceId}/extracted-article-sanitized.json`, extraction.sanitizedJsonPath, 'private_json', `${extraction.sourceId}_extracted_article_sanitized`))
      artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${extraction.sourceId}/extracted-article-text.txt`, extraction.textPath, 'private_text', `${extraction.sourceId}_extracted_article_text`))
      artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/extraction/${extraction.sourceId}/extraction-metadata.json`, extraction.metadataPath, 'private_json', `${extraction.sourceId}_extraction_metadata`))
    }
    artifacts.push(await uploadFile(hybridSearchConfig.generatedAssetsBucket, `${artifactPrefix}/manifest/hybrid-search-consensus-e2e-manifest.json`, await writeJson(localRoot, 'hybrid_search_consensus_e2e_manifest', manifest), 'private_json', 'hybrid_search_consensus_e2e_manifest'))
  } else {
    blockers.push('Private GCS upload preflight failed; Phase 49M artifacts were not uploaded.')
  }

  const qa = buildHybridSearchQaSummary({
    phase49LEvidenceOk: preflight.phase49LEvidenceOk,
    secret: safeSecret,
    secretMetadata,
    budget,
    braveApiCall,
    searxngSources: normalizedSearxngSources,
    braveSources: normalizedBraveSources,
    mergedSources,
    consensusReport,
    captureRecords,
    sharpRecords,
    extractionRecords,
    manifest,
    artifacts,
    publicAccessBlocked: preflight.publicAccessBlocked,
    blockers,
    warnings,
  })
  if (canUpload) {
    artifacts.push(await uploadFile(hybridSearchConfig.qaBucket, `${artifactPrefix}/qa/hybrid-search-consensus-e2e-qa.json`, await writeJson(localRoot, 'hybrid_search_consensus_e2e_qa', qa), 'private_json', 'hybrid_search_consensus_e2e_qa'))
  }

  const executionReport: HybridSearchExecutionReport = {
    ok: qa.status === 'passed',
    phase: '49M',
    status: qa.status === 'passed' ? 'completed' : 'blocked',
    runId,
    projectId: 'reeditpro',
    region: 'us-central1',
    mode: hybridSearchConfig.mode,
    planSnapshot,
    privateSearxngServiceUrlRedacted: serviceUrlRedacted,
    privateSearxngInvocationMethod: invocationMethod,
    searxngQueryResponses,
    braveApiCall,
    secret: safeSecret,
    secretMetadata,
    budget,
    normalizedSearxngSources,
    normalizedBraveSources,
    mergedSources,
    dedupeReport: { duplicateGroups, mergedSourceCount: mergedSources.length },
    consensusReport,
    selectedCaptureTargets,
    skippedCaptureTargets,
    captureRecords,
    sharpRecords,
    extractionRecords,
    combinedManifest: manifest,
    artifacts,
    qa,
    phase49NReadiness: qa.status === 'passed' ? 'ready_for_search_provider_readiness_gate' : 'blocked',
    safety: {
      ...hybridSearchSafetyFlags,
      publicAccessEnabled: false,
      signedUrlSourceOfTruth: false,
      otherPaidProvidersCalled: false,
    },
    blockers: qa.blockers,
    warnings: Array.from(new Set([...warnings, ...qa.warnings])),
  }
  if (canUpload) {
    artifacts.push(await uploadFile(hybridSearchConfig.qaBucket, `${artifactPrefix}/reports/phase49m-report.json`, await writeJson(localRoot, 'phase49m_report', executionReport), 'private_json', 'phase49m_report'))
    executionReport.artifacts = artifacts
  }
  await writeLocalReport(executionReport)
  await rm(localRoot, { recursive: true, force: true })
  return {
    executionReport,
    localReportPath: path.join(process.cwd(), HYBRID_SEARCH_LOCAL_REPORT_PATH),
    evidenceModule: hybridSearchEvidenceToTypeScript(executionReport),
    iamChanges: secretMetadata.iamChanges.length ? secretMetadata.iamChanges : ['not_required: existing permissions were sufficient for Phase 49M or execution was blocked before mutation.'],
  }
}

export async function runHybridSearchPreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProject = ''
  let serviceUrl = ''
  let phase49LEvidenceOk = false
  let publicAccessBlocked = false
  try {
    const [account, project, projectDescribe, serviceDescribe, servicePolicy, generatedBucket, qaBucket, phase49LReport] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', hybridSearchConfig.projectId, '--format=value(projectId)']),
      runGcloud(['run', 'services', 'describe', hybridSearchConfig.serviceName, '--region', hybridSearchConfig.region, '--project', hybridSearchConfig.projectId, '--format=json']),
      runGcloud(['run', 'services', 'get-iam-policy', hybridSearchConfig.serviceName, '--region', hybridSearchConfig.region, '--project', hybridSearchConfig.projectId, '--format=json']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${hybridSearchConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${hybridSearchConfig.qaBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'objects', 'describe', hybridSearchConfig.approvedPhase49LReportUri, '--format=value(name)']),
    ])
    activeProject = firstValue(project)
    if (!firstValue(account)) blockers.push('No active gcloud account is visible.')
    if (activeProject !== 'reeditpro') blockers.push('Active gcloud project must be exactly reeditpro.')
    if (firstValue(projectDescribe) !== 'reeditpro') blockers.push('gcloud cannot describe project reeditpro.')
    const service = JSON.parse(jsonSlice(serviceDescribe)) as { status?: { url?: string }; metadata?: { name?: string } }
    serviceUrl = service.status?.url ?? ''
    if (service.metadata?.name !== hybridSearchConfig.serviceName || !serviceUrl) blockers.push('Private SearXNG Cloud Run service is not reachable.')
    const policy = JSON.parse(jsonSlice(servicePolicy)) as { bindings?: Array<{ role?: string; members?: string[] }> }
    const invokerMembers = (policy.bindings ?? []).filter((binding) => binding.role === 'roles/run.invoker').flatMap((binding) => binding.members ?? [])
    if (invokerMembers.includes('allUsers') || invokerMembers.includes('allAuthenticatedUsers')) blockers.push('Private SearXNG Cloud Run service has public invoker IAM.')
    if (firstValue(generatedBucket) !== hybridSearchConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (firstValue(qaBucket) !== hybridSearchConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    phase49LEvidenceOk = Boolean(firstValue(phase49LReport))
    if (!phase49LEvidenceOk) blockers.push('Approved Phase 49L report object is not reachable.')
    await assertNoPublicBucketPrincipals([hybridSearchConfig.generatedAssetsBucket, hybridSearchConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }
  const envInput = {
    projectId: process.env.GCP_PROJECT_ID,
    activeProject,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E,
    braveSearchEnabled: process.env.BRAVE_SEARCH_ENABLED,
    dailyLimit: process.env.BRAVE_SEARCH_DAILY_LIMIT,
    monthlyBudgetUsd: process.env.BRAVE_SEARCH_MONTHLY_BUDGET_USD,
    maxResults: process.env.BRAVE_SEARCH_MAX_RESULTS,
    maxQueriesPerRun: process.env.BRAVE_SEARCH_MAX_QUERIES_PER_RUN,
    storeRawResults: process.env.BRAVE_SEARCH_STORE_RAW_RESULTS,
    storeSnippets: process.env.BRAVE_SEARCH_STORE_SNIPPETS,
  }
  return {
    allowed: blockers.length === 0,
    blockers,
    warnings,
    activeProject,
    phase49LEvidenceOk,
    serviceUrl,
    publicAccessBlocked,
    uploadPreflightAllowed: blockers.length === 0,
    envInput,
  }
}

async function runHybridPrivateSearxngQueryViaCloudRunProxy(): Promise<Awaited<ReturnType<typeof runHybridPrivateSearxngQuery>>> {
  const port = await getAvailableLocalPort()
  const proxy = spawn('gcloud', [
    'run',
    'services',
    'proxy',
    hybridSearchConfig.serviceName,
    '--project',
    hybridSearchConfig.projectId,
    '--region',
    hybridSearchConfig.region,
    `--port=${port}`,
  ], { stdio: ['ignore', 'pipe', 'pipe'] })
  let proxyOutput = ''
  proxy.stdout.on('data', (chunk) => { proxyOutput += chunk.toString() })
  proxy.stderr.on('data', (chunk) => { proxyOutput += chunk.toString() })
  try {
    await waitForCloudRunProxy(port, proxy, () => sanitizeSensitiveText(proxyOutput))
    return await runHybridPrivateSearxngQuery({ serviceUrl: `http://127.0.0.1:${port}` })
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
  throw new Error(`Cloud Run proxy did not become ready for ${hybridSearchConfig.serviceName}: ${getOutput().trim()}`)
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
  const url = firstValue(await runGcloud(['run', 'services', 'describe', hybridSearchConfig.serviceName, '--region', hybridSearchConfig.region, '--project', hybridSearchConfig.projectId, '--format=value(status.url)']))
  if (!url) throw new Error('Unable to resolve private SearXNG Cloud Run service URL.')
  return url
}

async function uploadFile(bucket: string, object: string, sourcePath: string, kind: HybridSearchArtifact['kind'], id: string): Promise<HybridSearchArtifact> {
  await runCommand('gcloud', ['storage', 'cp', sourcePath, `gs://${bucket}/${object}`])
  const stats = await stat(sourcePath)
  return { id, kind, bucket, object, gcsUri: `gs://${bucket}/${object}`, sizeBytes: stats.size, sha256: createHash('sha256').update(readFileSync(sourcePath)).digest('hex') }
}

async function writeJson(root: string, name: string, data: unknown): Promise<string> {
  const filePath = path.join(root, `${name}.json`)
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
  return filePath
}

async function writeLocalReport(report: HybridSearchExecutionReport): Promise<void> {
  const reportPath = path.join(process.cwd(), HYBRID_SEARCH_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')
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

function tokenValue(output: string): string {
  const token = firstValue(output)
  if (!token || !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) throw new Error(`Unable to parse identity token from gcloud output: ${sanitizeSensitiveText(output)}`)
  return token
}

function firstValue(output: string): string {
  return output.split(/\r?\n/).map((line) => line.trim()).find((line) => line && !line.startsWith('WARNING:') && !line.startsWith('An error occurred:') && !line.startsWith('/')) ?? ''
}

function jsonSlice(output: string): string {
  const start = output.indexOf('{')
  const end = output.lastIndexOf('}')
  return start === -1 || end === -1 || end < start ? '{}' : output.slice(start, end + 1)
}

function messageFromError(error: unknown): string {
  return sanitizeSensitiveText(error instanceof Error ? error.message : String(error))
}

function sanitizeSensitiveText(value: string): string {
  return value
    .replace(/Bearer\s+eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 'Bearer [redacted-jwt]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted-jwt]')
    .replace(/https:\/\/[A-Za-z0-9.-]+\.run\.app/g, '[redacted-authenticated-cloud-run-url]')
}

function emptyBraveApiCall(): BraveLiveApiCallSummary {
  return {
    attempted: false,
    completed: false,
    endpoint: hybridSearchConfig.braveEndpoint,
    method: 'GET',
    resultCount: 0,
    callCount: 0,
    requestHeadersStored: false,
    secretValuePrinted: false,
    rawResponseStored: false,
    snippetsStored: false,
    disallowedEndpointUsed: false,
  }
}

function emptyConsensusReport(): HybridSearchExecutionReport['consensusReport'] {
  return {
    query: hybridSearchConfig.query,
    searxngSourceCount: 0,
    braveSourceCount: 0,
    mergedSourceCount: 0,
    duplicateGroupCount: 0,
    duplicateGroups: [],
    providerAgreementScore: 0,
    sourceDiversityScore: 0,
    braveContributionCount: 0,
    searxngContributionCount: 0,
    searxngDefaultProvider: true,
    braveOptionalFallback: true,
    rawBraveResponseStored: false,
    braveSnippetStored: false,
    warnings: [],
    blockers: [],
  }
}
