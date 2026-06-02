import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildControlledLiveSearchCommandPlan,
  buildControlledLiveSearchIamPlan,
  buildControlledLiveSearchPlanSnapshot,
  buildControlledLiveSearchQaSummary,
  buildControlledLiveSearchReport,
  buildControlledLiveSearchSourceManifest,
  controlledLiveSearchConfig,
  controlledLiveSearchQaGateIds,
  controlledLiveSearchRequiredDocs,
  controlledLiveSearchRequiredScripts,
  controlledLiveSearchSafetyFlags,
  isSafeAllowlistedCaptureUrl,
  normalizeControlledLiveSearchResults,
  selectAllowlistedCaptureTargets,
  validateControlledLiveSearchCaptureE2EExecutionEnv,
  type ControlledLiveSearchCombinedManifest,
  type ControlledLiveSearchQueryResponse,
} from '../activation/controlled-live-search-capture-e2e'

const plan = buildControlledLiveSearchPlanSnapshot({ runId: 'phase49g-smoke' })
const response: ControlledLiveSearchQueryResponse = {
  query: controlledLiveSearchConfig.queries[0],
  queriedAt: '2026-06-02T00:00:00.000Z',
  results: [
    { title: 'SearXNG search API', url: 'https://docs.searxng.org/dev/search_api.html', content: 'SearXNG JSON search API documentation.', engine: 'duckduckgo', category: 'general' },
    { title: 'Playwright screenshots', url: 'https://playwright.dev/docs/screenshots', content: 'Playwright screenshot guide.', engine: 'duckduckgo', category: 'general' },
    { title: 'Blocked local', url: 'http://127.0.0.1/private', content: 'Unsafe local URL.' },
    { title: 'Blocked data', url: 'data:text/html,unsafe', content: 'Unsafe data URL.' },
  ],
}
const normalization = normalizeControlledLiveSearchResults({ responses: [response] })
const selection = selectAllowlistedCaptureTargets({ sources: normalization.sources })
const sourceManifest = buildControlledLiveSearchSourceManifest({
  runId: 'phase49g-smoke',
  sources: normalization.sources,
  captureRecords: [],
  extractionRecords: [],
  warnings: normalization.warnings,
  blockers: normalization.blockers,
})
const combinedManifest: ControlledLiveSearchCombinedManifest = {
  runId: 'phase49g-smoke',
  provider: 'searxng',
  serviceName: controlledLiveSearchConfig.serviceName,
  queries: controlledLiveSearchConfig.queries,
  normalizedSources: normalization.sources,
  selectedCaptureTargets: selection.selected,
  skippedCaptureTargets: selection.skipped,
  captureRecords: [],
  sharpRecords: [],
  extractionRecords: [],
  paidProviderUsed: false,
  publicSearxngUsed: false,
  arbitraryUrlCaptureUsed: false,
  publicArtifactAccess: false,
  warnings: [],
  blockers: [],
}
const qa = buildControlledLiveSearchQaSummary({
  phase49FEvidenceOk: true,
  planSnapshot: plan,
  queryResponses: [response],
  normalizedSources: normalization.sources,
  sourceManifest,
  captureRecords: [],
  sharpRecords: [],
  extractionRecords: [],
  combinedManifest,
  artifacts: [],
  preflightBlockers: [],
  warnings: [],
})
const report = buildControlledLiveSearchReport()

assert.equal(controlledLiveSearchConfig.phase, '49G')
assert.equal(controlledLiveSearchConfig.projectId, 'reeditpro')
assert.equal(controlledLiveSearchConfig.region, 'us-central1')
assert.equal(controlledLiveSearchConfig.env, 'staging')
assert.equal(controlledLiveSearchConfig.serviceName, 'reeditpro-staging-private-searxng')
assert.equal(controlledLiveSearchConfig.maxQueries <= 3, true)
assert.equal(controlledLiveSearchConfig.maxResultsPerQuery <= 5, true)
assert.equal(controlledLiveSearchConfig.maxCapturePages <= 2, true)
assert.ok(controlledLiveSearchConfig.allowedDomains.includes('docs.searxng.org'))
assert.ok(controlledLiveSearchConfig.allowedDomains.includes('playwright.dev'))
assert.ok(controlledLiveSearchConfig.allowedDomains.includes('sharp.pixelplumbing.com'))

assert.equal(controlledLiveSearchSafetyFlags.paidProvidersAllowed, false)
assert.equal(controlledLiveSearchSafetyFlags.publicSearxngInstanceAllowed, false)
assert.equal(controlledLiveSearchSafetyFlags.arbitraryUrlCaptureAllowed, false)
assert.equal(controlledLiveSearchSafetyFlags.publicArtifactAllowed, false)
assert.equal(controlledLiveSearchSafetyFlags.productionReadyAllowed, false)
assert.equal(controlledLiveSearchSafetyFlags.externalBetaAllowed, false)
assert.equal(controlledLiveSearchSafetyFlags.broadMediaAllowed, false)

assert.equal(plan.approvedPlanSnapshot, true)
assert.equal(plan.rawPromptExecution, false)
assert.equal(plan.provider, 'private_searxng_cloud_run')
assert.equal(plan.maxResultsPerQuery, 5)
assert.equal(plan.maxCapturePages, 2)
assert.equal(plan.publicSearxngInstanceAllowed, false)
assert.equal(plan.arbitraryUrlCaptureAllowed, false)

assert.equal(isSafeAllowlistedCaptureUrl('https://docs.searxng.org/dev/search_api.html'), true)
assert.equal(isSafeAllowlistedCaptureUrl('https://playwright.dev/docs/screenshots'), true)
assert.equal(isSafeAllowlistedCaptureUrl('https://example.com/not-allowed'), false)
assert.equal(isSafeAllowlistedCaptureUrl('javascript:alert(1)'), false)
assert.equal(isSafeAllowlistedCaptureUrl('http://127.0.0.1/private'), false)

assert.equal(normalization.sources.length, 2)
assert.ok(normalization.sources.every((source) => source.provider === 'searxng' && source.privateSearxngUsed && !source.paidProvider))
assert.ok(normalization.sources.every((source) => source.captureAllowed && source.extractionAllowed))
assert.equal(selection.selected.length, 2)
assert.ok(selection.selected.every((target) => controlledLiveSearchConfig.allowedDomains.some((domain) => target.domain === domain || target.domain.endsWith(`.${domain}`))))
assert.equal(sourceManifest.privateSearxngUsed, true)
assert.equal(sourceManifest.publicSearxngInstanceUsed, false)
assert.equal(sourceManifest.paidProviderUsed, false)
assert.equal(combinedManifest.paidProviderUsed, false)
assert.equal(combinedManifest.arbitraryUrlCaptureUsed, false)

assert.deepEqual(controlledLiveSearchQaGateIds, [
  'phase49f_evidence',
  'plan_snapshot_integrity',
  'private_searxng_query',
  'result_normalization',
  'allowlisted_capture_policy',
  'playwright_capture',
  'sharp_processing',
  'readability_extraction',
  'combined_manifest',
  'artifact_privacy',
  'blocked_features',
])
assert.equal(qa.status, 'blocked')
assert.ok(qa.gates.some((gate) => gate.gateId === 'playwright_capture' && !gate.passed))

const iamPlan = buildControlledLiveSearchIamPlan()
assert.ok(iamPlan.every((entry) => entry.reportOnly))
assert.ok(iamPlan.every((entry) => !entry.member.includes('allUsers')))
assert.ok(iamPlan.every((entry) => !entry.member.includes('allAuthenticatedUsers')))
assert.ok(iamPlan.some((entry) => entry.role === 'roles/run.invoker'))

const commandPlan = buildControlledLiveSearchCommandPlan()
assert.ok(commandPlan.some((entry) => entry.commandId === 'phase49g-execute-controlled-private-live-search-capture-e2e' && entry.requiresConfirmation && entry.mutatesGcp))
assert.ok(commandPlan.some((entry) => entry.commandId === 'blocked-public-searxng-instance' && !entry.allowedInPhase49G))
assert.ok(commandPlan.some((entry) => entry.commandId === 'blocked-paid-search-provider' && !entry.allowedInPhase49G))
assert.ok(commandPlan.some((entry) => entry.commandId === 'blocked-arbitrary-url-capture' && !entry.allowedInPhase49G))
assert.ok(!JSON.stringify(commandPlan).includes('PAID_PROVIDERS_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PUBLIC_SEARXNG_INSTANCE_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('ARBITRARY_URL_CAPTURE_ALLOWED=true'))

assert.equal(validateControlledLiveSearchCaptureE2EExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  paidProvidersAllowed: 'false',
  publicSearxngInstanceAllowed: 'false',
  arbitraryUrlCaptureAllowed: 'false',
  publicArtifactAllowed: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadMediaReady: 'false',
}).allowed, true)
assert.equal(validateControlledLiveSearchCaptureE2EExecutionEnv({ confirmation: 'false' }).allowed, false)

assert.equal(report.paidProviderAllowed, false)
assert.equal(report.publicSearxngInstanceAllowed, false)
assert.equal(report.arbitraryUrlCaptureAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadMediaAllowed, false)

for (const doc of controlledLiveSearchRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of controlledLiveSearchRequiredScripts) assert.ok(packageJson.scripts?.[script], `missing package script ${script}`)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'phase49g_policy',
    'private_searxng_required',
    'bounded_queries_results_and_captures',
    'allowlisted_domains',
    'public_searxng_blocked',
    'paid_provider_blocked',
    'arbitrary_url_capture_blocked',
    'source_manifest_required',
    'qa_gates',
    'package_scripts',
    'blocked_features',
  ],
}))
