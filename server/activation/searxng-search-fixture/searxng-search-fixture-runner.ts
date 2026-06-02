import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildSearxngFixtureProviderContract } from './searxng-fixture-provider-contract'
import { buildSearxngGeneratedFixtureResponse } from './searxng-fixture-data'
import { normalizeSearxngFixtureResults } from './searxng-result-normalizer'
import { buildSearxngSourceManifest } from './search-source-manifest-builder'
import {
  makeSearxngSearchFixtureRunId,
  searxngSearchFixtureArtifactPrefix,
  searxngSearchFixtureConfig,
  searxngSearchFixtureSafetyFlags,
  validateSearxngSearchFixtureExecutionEnv,
} from './searxng-search-fixture-policy'
import { searxngSearchFixtureEvidenceToTypeScript, SEARXNG_SEARCH_FIXTURE_LOCAL_REPORT_PATH } from './searxng-search-report-builder'
import { buildApprovedSearxngSearchPlanSnapshot } from './searxng-search-plan-snapshot'
import { buildSearxngSearchFixtureQaSummary } from './searxng-search-qa-summary'
import type {
  ApprovedSearxngSearchFixtureEvidence,
  SearxngSearchFixtureArtifact,
  SearxngSearchFixtureExecutionReport,
} from './searxng-search-fixture-types'

const execFileAsync = promisify(execFile)

export async function runSearxngSearchFixture(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49B generated SearXNG search fixture.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49B_RUN_ID ?? makeSearxngSearchFixtureRunId()
  const artifactPrefix = searxngSearchFixtureArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49b-searxng-search-fixture-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runSearxngSearchFixturePreflight()
  const fixtureResponse = buildSearxngGeneratedFixtureResponse()
  const providerContract = buildSearxngFixtureProviderContract(fixtureResponse)
  const normalization = normalizeSearxngFixtureResults(fixtureResponse)
  const sourceManifest = buildSearxngSourceManifest({
    query: searxngSearchFixtureConfig.query,
    sources: normalization.sources,
    normalizationWarnings: normalization.warnings,
    normalizationBlockers: normalization.blockers,
  })
  const planSnapshot = buildApprovedSearxngSearchPlanSnapshot(runId)
  const metadata = {
    phase: '49B',
    runId,
    provider: 'searxng',
    mode: 'generated_private_fixture',
    query: searxngSearchFixtureConfig.query,
    createdAt: new Date().toISOString(),
    providerContract,
    resultCount: fixtureResponse.results.length,
    normalizedSourceCount: normalization.sources.length,
    rejectedUrls: normalization.rejectedUrls,
    liveSearchUsed: false,
    publicWebRequestMade: false,
    browserLaunched: false,
    screenshotCaptured: false,
    paidProviderCalled: false,
  }
  const preflightBlockers = [
    ...preflight.blockers,
    ...normalization.blockers,
  ]
  const initialQa = buildSearxngSearchFixtureQaSummary({
    fixtureResponse,
    normalizedSourceCount: normalization.sources.length,
    normalizationBlockers: normalization.blockers,
    planSnapshot,
    sourceManifest,
    preflightBlockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  const artifacts: SearxngSearchFixtureArtifact[] = []
  artifacts.push(await uploadJson(searxngSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/plan/approved-search-plan-snapshot.json`, planSnapshot, localRoot, 'approved_search_plan_snapshot'))
  artifacts.push(await uploadJson(searxngSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/searxng-generated-fixture-response.json`, fixtureResponse, localRoot, 'searxng_generated_fixture_response'))
  artifacts.push(await uploadJson(searxngSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/normalized/normalized-search-results.json`, normalization.sources, localRoot, 'normalized_search_results'))
  artifacts.push(await uploadJson(searxngSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/sources/source-manifest.json`, sourceManifest, localRoot, 'source_manifest'))
  artifacts.push(await uploadJson(searxngSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/metadata/searxng-fixture-metadata.json`, metadata, localRoot, 'searxng_fixture_metadata'))

  const finalQa = buildSearxngSearchFixtureQaSummary({
    fixtureResponse,
    normalizedSourceCount: normalization.sources.length,
    normalizationBlockers: normalization.blockers,
    planSnapshot,
    sourceManifest,
    artifacts,
    preflightBlockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadJson(searxngSearchFixtureConfig.qaBucket, `${artifactPrefix}/qa/searxng-search-fixture-qa.json`, finalQa, localRoot, 'searxng_search_fixture_qa'))

  const executionReport: SearxngSearchFixtureExecutionReport = {
    ok: finalQa.status === 'passed' && initialQa.status === 'passed',
    phase: '49B',
    runId,
    projectId: 'reeditpro',
    provider: 'searxng',
    query: searxngSearchFixtureConfig.query,
    fixtureResultCount: fixtureResponse.results.length,
    normalizedSourceCount: normalization.sources.length,
    planSnapshot,
    sourceManifest,
    artifacts,
    qa: finalQa,
    phase49CReadiness: finalQa.status === 'passed' ? 'ready_for_playwright_sharp_generated_capture_fixture' : 'blocked',
    safety: {
      ...searxngSearchFixtureSafetyFlags,
      liveSearchExecuted: false,
      publicWebRequestMade: false,
      browserLaunched: false,
      screenshotCaptured: false,
      readabilityExtractionRun: false,
      sharpProcessingRun: false,
      paidProviderCalled: false,
      publicAccessEnabled: false,
    },
    blockers: finalQa.blockers,
    warnings: Array.from(new Set([...finalQa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(searxngSearchFixtureConfig.qaBucket, `${artifactPrefix}/reports/phase49b-report.json`, executionReport, localRoot, 'phase49b_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), SEARXNG_SEARCH_FIXTURE_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  const evidence: ApprovedSearxngSearchFixtureEvidence = {
    phase: '49B',
    status: executionReport.ok ? 'completed' : 'blocked',
    runId,
    defaultProvider: 'searxng',
    query: searxngSearchFixtureConfig.query,
    fixtureResultCount: executionReport.fixtureResultCount,
    normalizedSourceCount: executionReport.normalizedSourceCount,
    planSnapshotUri: `gs://${searxngSearchFixtureConfig.generatedAssetsBucket}/${artifactPrefix}/plan/approved-search-plan-snapshot.json`,
    fixtureResponseUri: `gs://${searxngSearchFixtureConfig.generatedAssetsBucket}/${artifactPrefix}/fixture/searxng-generated-fixture-response.json`,
    normalizedResultsUri: `gs://${searxngSearchFixtureConfig.generatedAssetsBucket}/${artifactPrefix}/normalized/normalized-search-results.json`,
    sourceManifestUri: `gs://${searxngSearchFixtureConfig.generatedAssetsBucket}/${artifactPrefix}/sources/source-manifest.json`,
    metadataUri: `gs://${searxngSearchFixtureConfig.generatedAssetsBucket}/${artifactPrefix}/metadata/searxng-fixture-metadata.json`,
    qaReportUri: `gs://${searxngSearchFixtureConfig.qaBucket}/${artifactPrefix}/qa/searxng-search-fixture-qa.json`,
    phase49bReportUri: `gs://${searxngSearchFixtureConfig.qaBucket}/${artifactPrefix}/reports/phase49b-report.json`,
    phase49CReadiness: executionReport.phase49CReadiness,
    blockers: executionReport.ok ? [] : executionReport.blockers,
    warnings: executionReport.warnings,
  }

  return {
    evidence,
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploaded generated/private fixture JSON using existing private GCS permissions'],
    evidenceModule: searxngSearchFixtureEvidenceToTypeScript(evidence),
  }
}

export async function runSearxngSearchFixturePreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', searxngSearchFixtureConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${searxngSearchFixtureConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${searxngSearchFixtureConfig.qaBucket}`, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== searxngSearchFixtureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== searxngSearchFixtureConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== searxngSearchFixtureConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== searxngSearchFixtureConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    await assertNoPublicBucketPrincipals([searxngSearchFixtureConfig.generatedAssetsBucket, searxngSearchFixtureConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateSearxngSearchFixtureExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_SEARXNG_SEARCH_FIXTURE,
    fixtureMode: process.env.REEDITPRO_SEARXNG_SEARCH_FIXTURE_MODE ?? searxngSearchFixtureConfig.fixtureMode,
    liveSearchAllowed: process.env.LIVE_SEARCH_ALLOWED ?? 'false',
    paidProvidersAllowed: process.env.PAID_PROVIDERS_ALLOWED ?? 'false',
    browserCaptureAllowed: process.env.BROWSER_CAPTURE_ALLOWED ?? 'false',
    publicArtifactAllowed: process.env.PUBLIC_ARTIFACT_ALLOWED ?? process.env.PUBLIC_ACCESS_ENABLED ?? 'false',
    productionReady: process.env.REEDITPRO_PRODUCTION_READY ?? 'false',
    externalBetaReady: process.env.REEDITPRO_EXTERNAL_BETA_READY ?? 'false',
    paidProductionReady: process.env.REEDITPRO_PAID_PRODUCTION_READY ?? 'false',
    broadRealMediaReady: process.env.REEDITPRO_BROAD_REAL_MEDIA_READY ?? 'false',
  })

  return {
    allowed: blockers.length === 0 && validation.allowed,
    blockers: [...validation.blockers, ...blockers],
    warnings: [...validation.warnings, ...warnings],
    activeAccount: activeAccountValue,
    activeProject: activeProjectValue,
    publicAccessBlocked,
  }
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string): Promise<SearxngSearchFixtureArtifact> {
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
  const hash = createHash('sha256')
  hash.update(readFileSync(filePath))
  return hash.digest('hex')
}

function lastGcloudValue(output: string): string {
  const lines = output.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith('WARNING:') && !line.includes('Python 3.9.x'))
  return lines.at(-1) ?? ''
}
