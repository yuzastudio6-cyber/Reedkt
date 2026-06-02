import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  buildApprovedSearxngSearchPlanSnapshot,
  buildSearxngGeneratedFixtureResponse,
  buildSearxngSearchFixtureCommandPlan,
  buildSearxngSearchFixtureIamPlan,
  buildSearxngSearchFixtureReport,
  buildSearxngSourceManifest,
  isSafeFixtureSearchUrl,
  normalizeSearxngFixtureResults,
  searxngSearchFixtureConfig,
  searxngSearchFixtureGateIds,
  searxngSearchFixtureRequiredDocs,
  searxngSearchFixtureRequiredScripts,
  searxngSearchFixtureSafetyFlags,
  validateFixtureSearchResult,
  validateSearxngSearchFixtureExecutionEnv,
} from '../activation/searxng-search-fixture'
import { buildWebSearchCaptureApprovalReport } from '../activation/web-search-capture-approval'

const fixtureResponse = buildSearxngGeneratedFixtureResponse()
const normalizationA = normalizeSearxngFixtureResults(fixtureResponse)
const normalizationB = normalizeSearxngFixtureResults(fixtureResponse)
const planSnapshot = buildApprovedSearxngSearchPlanSnapshot('phase49b-smoke')
const sourceManifest = buildSearxngSourceManifest({
  query: searxngSearchFixtureConfig.query,
  sources: normalizationA.sources,
  normalizationWarnings: normalizationA.warnings,
  normalizationBlockers: normalizationA.blockers,
})
const report = buildSearxngSearchFixtureReport()
const phase49A = buildWebSearchCaptureApprovalReport()

assert.equal(searxngSearchFixtureConfig.phase, '49B')
assert.equal(searxngSearchFixtureConfig.projectId, 'reeditpro')
assert.equal(searxngSearchFixtureConfig.region, 'us-central1')
assert.equal(searxngSearchFixtureConfig.env, 'staging')
assert.equal(searxngSearchFixtureConfig.defaultProvider, 'searxng')
assert.equal(searxngSearchFixtureConfig.fixtureMode, 'generated_private_fixture')
assert.equal(searxngSearchFixtureConfig.query, 'ReeditPro open source video editing toolchain documentation')

assert.equal(phase49A.status, 'approval_review_complete')
assert.equal(phase49A.searxngPlanningAllowed, true)
assert.equal(phase49A.liveSearchAllowed, false)
assert.equal(phase49A.browserCaptureAllowed, false)
assert.equal(phase49A.paidProviderAllowed, false)

assert.equal(fixtureResponse.provider, 'searxng')
assert.equal(fixtureResponse.generatedFixture, true)
assert.equal(fixtureResponse.liveSearchUsed, false)
assert.ok(fixtureResponse.results.length >= searxngSearchFixtureConfig.minResults)
assert.ok(fixtureResponse.results.length <= searxngSearchFixtureConfig.maxResults)
assert.deepEqual(normalizationA.sources, normalizationB.sources)
assert.equal(normalizationA.blockers.length, 0)
assert.equal(normalizationA.sources.length, fixtureResponse.results.length)

for (const source of normalizationA.sources) {
  assert.ok(source.sourceId.startsWith('src_searxng_'))
  assert.equal(source.provider, 'searxng')
  assert.ok(source.title.length > 0)
  assert.ok(source.url.startsWith('https://'))
  assert.ok(source.domain.endsWith('.example.test') || source.domain.endsWith('.invalid') || source.domain === 'example.invalid')
  assert.ok(source.snippet.length > 0)
  assert.ok(source.rank >= 1)
  assert.equal(source.sourceType, 'generated_search_fixture')
  assert.equal(source.attributionRequired, true)
  assert.equal(source.captureAllowed, false)
  assert.equal(source.extractionAllowed, false)
  assert.equal(source.paidProvider, false)
  assert.equal(source.generatedFixture, true)
}

for (const badUrl of ['javascript:alert(1)', 'data:text/html,hi', 'file:///tmp/a', 'http://localhost/test', 'http://127.0.0.1/test', 'http://10.0.0.5/test', 'http://192.168.1.9/test', 'https://real.example.com/test']) {
  const validation = validateFixtureSearchResult({ title: 'Bad', url: badUrl, content: 'unsafe' })
  assert.equal(validation.safe, false, `expected unsafe URL rejection for ${badUrl}`)
}
assert.equal(isSafeFixtureSearchUrl(new URL('https://docs.example.test/reeditpro')).safe, true)

assert.equal(sourceManifest.generatedFixture, true)
assert.equal(sourceManifest.sourceCount, normalizationA.sources.length)
assert.equal(sourceManifest.liveSearchUsed, false)
assert.equal(sourceManifest.paidProviderUsed, false)
assert.equal(sourceManifest.captureStatus, 'not_captured_phase49b')
assert.equal(sourceManifest.extractionStatus, 'not_extracted_phase49b')

assert.equal(planSnapshot.approvedPlanSnapshot, true)
assert.equal(planSnapshot.rawPromptExecution, false)
assert.equal(planSnapshot.provider, 'searxng')
assert.equal(planSnapshot.mode, 'generated_private_fixture')
assert.equal(planSnapshot.liveSearchAllowed, false)
assert.equal(planSnapshot.browserCaptureAllowed, false)
assert.equal(planSnapshot.paidProviderAllowed, false)
assert.equal(planSnapshot.publicArtifactAllowed, false)
assert.deepEqual(planSnapshot.disabledProviderIds, ['brave-search-api', 'tavily', 'exa', 'firecrawl', 'browserless-browserbase'])

for (const value of Object.values(searxngSearchFixtureSafetyFlags)) assert.equal(value, false)
assert.equal(validateSearxngSearchFixtureExecutionEnv({
  projectId: 'reeditpro',
  activeProject: 'reeditpro',
  region: 'us-central1',
  env: 'staging',
  confirmation: 'true',
  fixtureMode: 'generated_private_fixture',
  liveSearchAllowed: 'false',
  paidProvidersAllowed: 'false',
  browserCaptureAllowed: 'false',
  publicArtifactAllowed: 'false',
  productionReady: 'false',
  externalBetaReady: 'false',
  paidProductionReady: 'false',
  broadRealMediaReady: 'false',
}).allowed, true)
assert.equal(validateSearxngSearchFixtureExecutionEnv({ confirmation: 'false' }).allowed, false)

const iamPlan = buildSearxngSearchFixtureIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((plan) => plan.reportOnly))
assert.ok(iamPlan.every((plan) => plan.role === 'roles/storage.objectCreator'))
assert.ok(iamPlan.every((plan) => !plan.commandString.includes('allUsers') && !plan.commandString.includes('storage.admin') && !plan.commandString.includes('storage.objectAdmin')))
assert.ok(iamPlan.every((plan) => plan.conditionExpression.includes('/objects/activation-web-search/phase49b/')))

const commandPlan = buildSearxngSearchFixtureCommandPlan()
assert.ok(commandPlan.some((plan) => plan.commandId === 'phase49b-generated-fixture-execution' && plan.requiresConfirmation))
assert.ok(!JSON.stringify(commandPlan).includes('LIVE_SEARCH_ALLOWED=true'))
assert.ok(!JSON.stringify(commandPlan).includes('PAID_PROVIDERS_ALLOWED=true'))

assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), searxngSearchFixtureGateIds)
assert.equal(report.qa.gates.every((gate) => gate.passed), true)
assert.ok(['blocked_pending_phase49b_execution', 'ready_for_playwright_sharp_generated_capture_fixture'].includes(report.phase49CReadiness))
assert.equal(report.liveSearchAllowed, false)
assert.equal(report.browserCaptureAllowed, false)
assert.equal(report.paidProviderAllowed, false)
assert.equal(report.publicArtifactAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.paidProductionAllowed, false)
assert.equal(report.broadRealMediaAllowed, false)

for (const doc of searxngSearchFixtureRequiredDocs) assert.ok(existsSync(doc), `missing doc ${doc}`)
const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts?: Record<string, string> }
for (const script of searxngSearchFixtureRequiredScripts) assert.ok(packageJson.scripts?.[script], `missing package script ${script}`)

console.log(JSON.stringify({
  ok: true,
  checks: [
    'provider_defaults',
    'fixture_determinism',
    'url_rejection',
    'normalized_source_fields',
    'source_manifest',
    'plan_snapshot_safety',
    'private_artifact_prefixes',
    'phase49c_readiness',
    'blocked_gates',
  ],
}))
