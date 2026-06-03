import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { stat } from 'node:fs/promises'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { braveLiveApiConfig, braveLiveArtifactPrefix, braveLiveSafetyFlags, makeBraveLiveRunId, validateBraveLiveApiValidationEnv } from './brave-live-api-policy'
import { buildBraveLiveBudgetGuard } from './brave-live-budget-guard'
import { runBraveLiveApiQuery } from './brave-live-api-client'
import { buildBraveLiveQueryPlan } from './brave-live-query-plan'
import { normalizeBraveLiveResults } from './brave-live-result-normalizer'
import { redactBraveLiveSecretResolution, inspectBraveLiveSecretMetadata, resolveBraveLiveSecret } from './brave-live-secret-resolver'
import { buildBraveLiveSourceManifest } from './brave-live-source-manifest-builder'
import { buildBraveLiveStorageGuard } from './brave-live-storage-guard'
import { buildBraveLiveQaSummary } from './brave-live-qa-summary'
import { BRAVE_LIVE_LOCAL_REPORT_PATH } from './brave-live-report-builder'
import type { BraveLiveApiCallSummary, BraveLiveArtifact, BraveLiveExecutionReport, BraveLiveMetadata, NormalizedBraveLiveSourceRecord } from './brave-live-api-types'

const execFileAsync = promisify(execFile)

export async function runBraveLiveApiValidation(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49L Brave controlled live API validation.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49L_RUN_ID ?? makeBraveLiveRunId()
  const artifactPrefix = braveLiveArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49l-brave-live-api-validation-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runBraveLivePreflight()
  const secret = await resolveBraveLiveSecret()
  const secretMetadata = await inspectBraveLiveSecretMetadata({ attemptMissingIamGrant: true })
  const fullEnv = validateBraveLiveApiValidationEnv({ ...preflight.envInput, secretConfigured: secret.configured })
  const safeSecret = redactBraveLiveSecretResolution(secret)
  const budget = buildBraveLiveBudgetGuard()
  const planSnapshot = buildBraveLiveQueryPlan(runId)
  const blockers = [...preflight.blockers, ...secret.blockers, ...secretMetadata.blockers, ...fullEnv.blockers, ...budget.blockers]
  const warnings = [...preflight.warnings, ...secret.warnings, ...secretMetadata.warnings, ...fullEnv.warnings, ...budget.warnings]

  let apiCall = emptyApiCall()
  let normalizedSources: NormalizedBraveLiveSourceRecord[] = []
  let normalizationBlockers: string[] = []
  if (!blockers.length && secret.secretValue) {
    const apiResult = await runBraveLiveApiQuery({ apiKey: secret.secretValue })
    apiCall = apiResult.summary
    const normalization = normalizeBraveLiveResults({ results: apiResult.results })
    normalizedSources = normalization.sources
    normalizationBlockers = normalization.blockers
    blockers.push(...apiResult.blockers, ...normalization.blockers)
    warnings.push(...apiResult.warnings, ...normalization.warnings)
  }

  const storageGuard = buildBraveLiveStorageGuard({ normalizedSourceCount: normalizedSources.length })
  blockers.push(...storageGuard.blockers)
  warnings.push(...storageGuard.warnings)
  const sourceManifest = buildBraveLiveSourceManifest({
    runId,
    sources: normalizedSources,
    budget,
    secret: safeSecret,
    actualCallCount: apiCall.callCount,
    warnings: Array.from(new Set(warnings)),
    blockers: Array.from(new Set([...blockers, ...normalizationBlockers])),
  })
  const metadata: BraveLiveMetadata = {
    runId,
    provider: 'brave_search',
    mode: 'controlled_live_api_validation',
    endpoint: braveLiveApiConfig.endpoint,
    queryHash: createHash('sha256').update(braveLiveApiConfig.query).digest('hex'),
    callCount: apiCall.callCount,
    normalizedSourceCount: normalizedSources.length,
    rawResponseStored: false,
    snippetsStored: false,
    requestHeadersStored: false,
    secretValuePrinted: false,
    secretSource: safeSecret.source,
    storageRightsApproved: false,
  }

  const artifacts: BraveLiveArtifact[] = []
  const canUpload = preflight.uploadPreflightAllowed
  if (canUpload) {
    artifacts.push(await uploadJson(braveLiveApiConfig.generatedAssetsBucket, `${artifactPrefix}/plan/brave-live-api-validation-plan.json`, planSnapshot, localRoot, 'brave_live_api_validation_plan'))
    artifacts.push(await uploadJson(braveLiveApiConfig.generatedAssetsBucket, `${artifactPrefix}/normalized/brave-live-normalized-sources.json`, normalizedSources, localRoot, 'brave_live_normalized_sources'))
    artifacts.push(await uploadJson(braveLiveApiConfig.generatedAssetsBucket, `${artifactPrefix}/sources/brave-live-source-manifest.json`, sourceManifest, localRoot, 'brave_live_source_manifest'))
    artifacts.push(await uploadJson(braveLiveApiConfig.generatedAssetsBucket, `${artifactPrefix}/metadata/brave-live-validation-metadata.json`, metadata, localRoot, 'brave_live_validation_metadata'))
  } else {
    blockers.push('Private GCS upload preflight failed; Phase 49L artifacts were not uploaded.')
  }

  const qa = buildBraveLiveQaSummary({
    secret: safeSecret,
    secretMetadata,
    budget,
    apiCall,
    normalizedSources,
    sourceManifest,
    artifacts,
    publicAccessBlocked: preflight.publicAccessBlocked,
    blockers,
    warnings,
  })
  if (canUpload) {
    artifacts.push(await uploadJson(braveLiveApiConfig.qaBucket, `${artifactPrefix}/qa/brave-live-api-validation-qa.json`, qa, localRoot, 'brave_live_api_validation_qa'))
  }

  const executionReport: BraveLiveExecutionReport = {
    ok: qa.status === 'passed',
    phase: '49L',
    status: qa.status === 'passed' ? 'completed' : 'blocked',
    runId,
    projectId: 'reeditpro',
    provider: 'brave_search',
    mode: 'controlled_live_api_validation',
    planSnapshot,
    secret: safeSecret,
    secretMetadata,
    budget,
    apiCall,
    normalizedSources,
    sourceManifest,
    metadata,
    artifacts,
    qa,
    phase49MReadiness: qa.status === 'passed' ? 'ready_for_searxng_brave_hybrid_consensus_e2e' : 'blocked',
    safety: braveLiveSafetyFlags,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
  if (canUpload) {
    artifacts.push(await uploadJson(braveLiveApiConfig.qaBucket, `${artifactPrefix}/reports/phase49l-report.json`, executionReport, localRoot, 'phase49l_report'))
    executionReport.artifacts = artifacts
  }

  const localReportPath = path.join(process.cwd(), BRAVE_LIVE_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')
  await rm(localRoot, { recursive: true, force: true })

  return {
    executionReport,
    localReportPath,
    iamChanges: secretMetadata.iamChanges.length ? secretMetadata.iamChanges : ['not_required: existing permissions were sufficient for Phase 49L or execution was blocked before mutation.'],
  }
}

export async function runBraveLivePreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', braveLiveApiConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${braveLiveApiConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${braveLiveApiConfig.qaBucket}`, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== braveLiveApiConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== braveLiveApiConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== braveLiveApiConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== braveLiveApiConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    await assertNoPublicBucketPrincipals([braveLiveApiConfig.generatedAssetsBucket, braveLiveApiConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }
  const envInput = {
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_BRAVE_LIVE_API_VALIDATION,
    braveSearchEnabled: process.env.BRAVE_SEARCH_ENABLED,
    dailyLimit: process.env.BRAVE_SEARCH_DAILY_LIMIT,
    monthlyBudgetUsd: process.env.BRAVE_SEARCH_MONTHLY_BUDGET_USD,
    maxResults: process.env.BRAVE_SEARCH_MAX_RESULTS,
    maxQueriesPerRun: process.env.BRAVE_SEARCH_MAX_QUERIES_PER_RUN,
    storeRawResults: process.env.BRAVE_SEARCH_STORE_RAW_RESULTS,
    storeSnippets: process.env.BRAVE_SEARCH_STORE_SNIPPETS,
  }
  return {
    blockers,
    warnings,
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    publicAccessBlocked,
    uploadPreflightAllowed: blockers.length === 0,
    envInput,
  }
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string): Promise<BraveLiveArtifact> {
  const filePath = path.join(root, `${id}.json`)
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  const stats = await stat(filePath)
  const sha256 = await sha256File(filePath)
  await runCommand('gcloud', ['storage', 'cp', filePath, `gs://${bucket}/${object}`])
  return {
    id,
    kind: 'private_json',
    bucket,
    object,
    gcsUri: `gs://${bucket}/${object}`,
    sizeBytes: stats.size,
    sha256,
  }
}

async function assertNoPublicBucketPrincipals(buckets: string[], blockers: string[]) {
  for (const bucket of buckets) {
    const policy = await runGcloud(['storage', 'buckets', 'get-iam-policy', `gs://${bucket}`, '--format=json'])
    if (policy.includes('allUsers') || policy.includes('allAuthenticatedUsers')) blockers.push(`Bucket ${bucket} has a public IAM principal.`)
  }
}

async function runGcloud(args: string[]): Promise<string> {
  const result = await execFileAsync('gcloud', args, { maxBuffer: 20 * 1024 * 1024 })
  return result.stdout ?? ''
}

async function runCommand(command: string, args: string[], timeout = 10 * 60 * 1000): Promise<string> {
  const result = await execFileAsync(command, args, { timeout, maxBuffer: 128 * 1024 * 1024 })
  return `${result.stdout ?? ''}${result.stderr ?? ''}`
}

async function sha256File(filePath: string): Promise<string> {
  const { createReadStream } = await import('node:fs')
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)
    stream.on('error', reject)
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('end', () => resolve(hash.digest('hex')))
  })
}

function lastGcloudValue(output: string): string {
  const lines = output.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines[lines.length - 1] ?? ''
}

function emptyApiCall(): BraveLiveApiCallSummary {
  return {
    attempted: false,
    completed: false,
    endpoint: braveLiveApiConfig.endpoint,
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
