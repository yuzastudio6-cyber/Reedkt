import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { promisify } from 'node:util'
import { buildBraveShapedFixtureResponse } from './brave-shaped-fixture-data'
import { buildBraveFixtureSourceManifest } from './brave-fixture-source-manifest-builder'
import { BRAVE_FIXTURE_LOCAL_REPORT_PATH } from './brave-fixture-report-builder'
import { buildBraveFixtureQaSummary } from './brave-fixture-qa-summary'
import {
  braveSearchFixtureArtifactPrefix,
  braveSearchFixtureConfig,
  braveSearchFixtureSafetyFlags,
  buildBraveFixturePlanSnapshot,
  makeBraveSearchFixtureRunId,
  validateBraveFixtureNormalizerExecutionEnv,
} from './brave-search-fixture-policy'
import { normalizeBraveFixtureResults } from './brave-result-normalizer'
import { buildSearchProviderRouterFixtureDecisions } from './search-provider-router-fixture'
import { buildSearchResultDedupeFixture } from './search-result-dedupe'
import { buildSearxngConfidenceFixtureScenarios } from './search-confidence-fixture-runner'
import type { BraveFixtureArtifact, BraveFixtureExecutionReport } from './brave-search-fixture-types'

const execFileAsync = promisify(execFile)

export async function runBraveSearchFixtureNormalizer(input: { execute: boolean; runId?: string }) {
  if (!input.execute) throw new Error('Pass --execute to run Phase 49K Brave-shaped fixture normalizer.')
  const runId = input.runId ?? process.env.REEDITPRO_PHASE49K_RUN_ID ?? makeBraveSearchFixtureRunId()
  const artifactPrefix = braveSearchFixtureArtifactPrefix(runId)
  const localRoot = path.join(os.tmpdir(), `reeditpro-phase49k-brave-fixture-normalizer-${runId}`)
  await rm(localRoot, { recursive: true, force: true })
  await mkdir(localRoot, { recursive: true })

  const preflight = await runBraveSearchFixturePreflight()
  const fixtureResponse = buildBraveShapedFixtureResponse()
  const normalization = normalizeBraveFixtureResults(fixtureResponse)
  const confidenceScenarios = buildSearxngConfidenceFixtureScenarios()
  const routerDecisions = buildSearchProviderRouterFixtureDecisions(confidenceScenarios)
  const dedupeFixture = buildSearchResultDedupeFixture(normalization.sources)
  const sourceManifest = buildBraveFixtureSourceManifest({
    runId,
    sources: normalization.sources,
    confidenceScenarios,
    routerDecisions,
    dedupeFixture,
    normalizationWarnings: normalization.warnings,
    normalizationBlockers: normalization.blockers,
  })
  const planSnapshot = buildBraveFixturePlanSnapshot(runId)
  const preflightBlockers = [...preflight.blockers, ...normalization.blockers]
  const initialQa = buildBraveFixtureQaSummary({
    fixtureResponse,
    normalizedSources: normalization.sources,
    normalizationBlockers: normalization.blockers,
    planSnapshot,
    sourceManifest,
    confidenceScenarios,
    routerDecisions,
    dedupeFixture,
    preflightBlockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  const artifacts: BraveFixtureArtifact[] = []
  artifacts.push(await uploadJson(braveSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/plan/brave-fixture-normalizer-plan.json`, planSnapshot, localRoot, 'brave_fixture_normalizer_plan'))
  artifacts.push(await uploadJson(braveSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/fixture/brave-shaped-fixture-response.json`, fixtureResponse, localRoot, 'brave_shaped_fixture_response'))
  artifacts.push(await uploadJson(braveSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/normalized/brave-normalized-sources.json`, normalization.sources, localRoot, 'brave_normalized_sources'))
  artifacts.push(await uploadJson(braveSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/confidence/searxng-confidence-scenarios.json`, confidenceScenarios, localRoot, 'searxng_confidence_scenarios'))
  artifacts.push(await uploadJson(braveSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/router/provider-router-decisions.json`, routerDecisions, localRoot, 'provider_router_decisions'))
  artifacts.push(await uploadJson(braveSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/dedupe/searxng-brave-dedupe-fixture.json`, dedupeFixture, localRoot, 'searxng_brave_dedupe_fixture'))
  artifacts.push(await uploadJson(braveSearchFixtureConfig.generatedAssetsBucket, `${artifactPrefix}/sources/brave-fixture-source-manifest.json`, sourceManifest, localRoot, 'brave_fixture_source_manifest'))

  const finalQa = buildBraveFixtureQaSummary({
    fixtureResponse,
    normalizedSources: normalization.sources,
    normalizationBlockers: normalization.blockers,
    planSnapshot,
    sourceManifest,
    confidenceScenarios,
    routerDecisions,
    dedupeFixture,
    artifacts,
    preflightBlockers,
    publicAccessBlocked: preflight.publicAccessBlocked,
  })
  artifacts.push(await uploadJson(braveSearchFixtureConfig.qaBucket, `${artifactPrefix}/qa/brave-search-fixture-normalizer-qa.json`, finalQa, localRoot, 'brave_search_fixture_normalizer_qa'))

  const executionReport: BraveFixtureExecutionReport = {
    ok: finalQa.status === 'passed' && initialQa.status === 'passed',
    phase: '49K',
    runId,
    projectId: 'reeditpro',
    provider: 'brave_search',
    query: braveSearchFixtureConfig.query,
    fixtureResultCount: fixtureResponse.web.results.length,
    normalizedSourceCount: normalization.sources.length,
    planSnapshot,
    fixtureResponse,
    normalizedSources: normalization.sources,
    confidenceScenarios,
    routerDecisions,
    dedupeFixture,
    sourceManifest,
    artifacts,
    qa: finalQa,
    phase49LReadiness: finalQa.status === 'passed' ? 'ready_for_brave_controlled_live_api_validation' : 'blocked',
    safety: {
      ...braveSearchFixtureSafetyFlags,
      braveApiCalled: false,
      liveSearchExecuted: false,
      browserLaunched: false,
      screenshotCaptured: false,
      readabilityExtractionRun: false,
      paidProviderCalled: false,
      publicAccessEnabled: false,
    },
    blockers: finalQa.blockers,
    warnings: Array.from(new Set([...finalQa.warnings, ...preflight.warnings])),
  }
  artifacts.push(await uploadJson(braveSearchFixtureConfig.qaBucket, `${artifactPrefix}/reports/phase49k-report.json`, executionReport, localRoot, 'phase49k_report'))
  executionReport.artifacts = artifacts

  const localReportPath = path.join(process.cwd(), BRAVE_FIXTURE_LOCAL_REPORT_PATH)
  await mkdir(path.dirname(localReportPath), { recursive: true })
  await writeFile(localReportPath, `${JSON.stringify(executionReport, null, 2)}\n`, 'utf8')

  return {
    executionReport,
    localReportPath,
    iamChanges: ['not_required: active account uploaded private Brave-shaped fixture JSON using existing private GCS permissions'],
  }
}

export async function runBraveSearchFixturePreflight() {
  const blockers: string[] = []
  const warnings: string[] = []
  let activeProjectValue = ''
  let activeAccountValue = ''
  let publicAccessBlocked = false
  try {
    const [activeAccount, activeProject, projectDescribe, generatedAssetsBucket, qaBucket] = await Promise.all([
      runGcloud(['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)']),
      runGcloud(['config', 'get-value', 'project']),
      runGcloud(['projects', 'describe', braveSearchFixtureConfig.projectId, '--format=value(projectId)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${braveSearchFixtureConfig.generatedAssetsBucket}`, '--format=value(name)']),
      runGcloud(['storage', 'buckets', 'describe', `gs://${braveSearchFixtureConfig.qaBucket}`, '--format=value(name)']),
    ])
    activeAccountValue = lastGcloudValue(activeAccount)
    activeProjectValue = lastGcloudValue(activeProject)
    if (!activeAccountValue) blockers.push('No active gcloud account is visible.')
    if (activeProjectValue !== braveSearchFixtureConfig.projectId) blockers.push('Active gcloud project must be exactly reeditpro.')
    if (lastGcloudValue(projectDescribe) !== braveSearchFixtureConfig.projectId) blockers.push('gcloud cannot describe project reeditpro.')
    if (lastGcloudValue(generatedAssetsBucket) !== braveSearchFixtureConfig.generatedAssetsBucket) blockers.push('Generated-assets bucket is not reachable.')
    if (lastGcloudValue(qaBucket) !== braveSearchFixtureConfig.qaBucket) blockers.push('QA bucket is not reachable.')
    await assertNoPublicBucketPrincipals([braveSearchFixtureConfig.generatedAssetsBucket, braveSearchFixtureConfig.qaBucket], blockers)
    publicAccessBlocked = !blockers.some((blocker) => blocker.includes('public IAM principal'))
  } catch (error) {
    blockers.push(error instanceof Error ? error.message : String(error))
  }

  const validation = validateBraveFixtureNormalizerExecutionEnv({
    projectId: process.env.GCP_PROJECT_ID,
    activeProject: activeProjectValue,
    region: process.env.GCP_REGION,
    env: process.env.REEDITPRO_ENV,
    confirmation: process.env.REEDITPRO_CONFIRM_BRAVE_FIXTURE_NORMALIZER,
    mode: process.env.REEDITPRO_BRAVE_FIXTURE_NORMALIZER_MODE ?? braveSearchFixtureConfig.mode,
    liveBraveApiAllowed: process.env.LIVE_BRAVE_API_ALLOWED ?? 'false',
    paidProviderAllowed: process.env.PAID_PROVIDERS_ALLOWED ?? 'false',
    rawBraveResponseStorageAllowed: process.env.RAW_BRAVE_RESPONSE_STORAGE_ALLOWED ?? 'false',
    braveSnippetStorageAllowed: process.env.BRAVE_SNIPPET_STORAGE_ALLOWED ?? 'false',
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
    publicAccessBlocked,
  }
}

async function uploadJson(bucket: string, object: string, payload: unknown, root: string, id: string): Promise<BraveFixtureArtifact> {
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
