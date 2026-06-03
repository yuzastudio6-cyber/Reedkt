import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  braveSearchFixtureConfig,
  braveSearchFixtureQaGateIds,
  braveSearchFixtureRequiredDocs,
  braveSearchFixtureRequiredScripts,
  braveSearchFixtureSafetyFlags,
  buildBraveFixtureCommandPlan,
  buildBraveFixtureIamPlan,
  buildBraveSearchFixtureNormalizerReport,
  buildBraveShapedFixtureResponse,
  buildSearchProviderRouterFixtureDecisions,
  buildSearchResultDedupeFixture,
  buildSearxngConfidenceFixtureScenarios,
  normalizeBraveFixtureResults,
  validateBraveFixtureResult,
} from '../activation/brave-search-fixture-normalizer'

assert.equal(braveSearchFixtureConfig.phase, '49K')
assert.equal(braveSearchFixtureConfig.provider, 'brave_search')
assert.equal(braveSearchFixtureConfig.mode, 'brave_shaped_fixture_normalizer')
assert.equal(braveSearchFixtureSafetyFlags.braveEnabledByDefault, false)
assert.equal(braveSearchFixtureSafetyFlags.liveBraveApiAllowed, false)
assert.equal(braveSearchFixtureSafetyFlags.paidProviderAllowed, false)
assert.equal(braveSearchFixtureSafetyFlags.rawBraveResponseStorageAllowed, false)
assert.equal(braveSearchFixtureSafetyFlags.braveSnippetStorageAllowed, false)
assert.equal(braveSearchFixtureSafetyFlags.searxngDefaultProvider, true)
assert.equal(braveSearchFixtureSafetyFlags.providerExecutionAllowed, false)
assert.equal(braveSearchFixtureSafetyFlags.productionReadyAllowed, false)
assert.equal(braveSearchFixtureSafetyFlags.externalBetaAllowed, false)
assert.equal(braveSearchFixtureSafetyFlags.broadMediaAllowed, false)

const fixture = buildBraveShapedFixtureResponse()
assert.equal(fixture.generatedFixture, true)
assert.equal(fixture.liveProviderCallUsed, false)
assert.equal(fixture.rawProviderResponseStored, false)
assert.ok(fixture.web.results.length >= 5)
assert.ok(fixture.web.results.length <= 8)

const normalization = normalizeBraveFixtureResults(fixture)
assert.equal(normalization.blockers.length, 0)
assert.equal(normalization.sources.length, fixture.web.results.length)
assert.ok(normalization.sources.every((source) => source.provider === 'brave_search'))
assert.ok(normalization.sources.every((source) => source.providerMode === 'fixture'))
assert.ok(normalization.sources.every((source) => source.generatedFixture))
assert.ok(normalization.sources.every((source) => source.paidProvider))
assert.ok(normalization.sources.every((source) => !source.liveProviderCallUsed && !source.rawProviderResponseStored))
assert.ok(normalization.sources.every((source) => !source.captureAllowed && !source.extractionAllowed))

assert.equal(validateBraveFixtureResult({ title: 'Unsafe', url: 'javascript:alert(1)', description: 'bad' }).safe, false)
assert.equal(validateBraveFixtureResult({ title: 'Unsafe', url: 'file:///tmp/test.html', description: 'bad' }).safe, false)
assert.equal(validateBraveFixtureResult({ title: 'Unsafe', url: 'https://127.0.0.1/test', description: 'bad' }).safe, false)
assert.equal(validateBraveFixtureResult({ title: 'Unsafe', url: 'https://public.example.com/test', description: 'bad' }).safe, false)

const scenarios = buildSearxngConfidenceFixtureScenarios()
assert.equal(scenarios.length, 3)
assert.equal(scenarios.find((scenario) => scenario.scenarioId === 'searxng_high_confidence')?.result.braveFallbackRecommended, false)
assert.equal(scenarios.find((scenario) => scenario.scenarioId === 'searxng_low_confidence')?.result.braveFallbackRecommended, true)
assert.equal(scenarios.find((scenario) => scenario.scenarioId === 'searxng_freshness_gap')?.result.braveFallbackRecommended, true)
assert.ok(scenarios.every((scenario) => scenario.result.braveExecutionAllowed === false))

const routerDecisions = buildSearchProviderRouterFixtureDecisions(scenarios)
assert.equal(routerDecisions.length, 4)
assert.ok(routerDecisions.some((decision) => decision.mode === 'searxng_only' && decision.selectedProvider === 'searxng'))
assert.ok(routerDecisions.every((decision) => decision.providerExecutionAllowed === false))
assert.ok(routerDecisions.every((decision) => decision.planningOnly === true))

const dedupeFixture = buildSearchResultDedupeFixture(normalization.sources)
assert.equal(dedupeFixture.fixtureOnly, true)
assert.ok(dedupeFixture.duplicateGroups.length > 0)
assert.ok(dedupeFixture.providerAgreementScore > 0)
assert.ok(dedupeFixture.sourceDiversityScore > 0)

const commandPlan = buildBraveFixtureCommandPlan()
assert.ok(commandPlan.some((command) => command.commandId === 'phase49k-fixture-normalizer-execution' && command.requiresConfirmation))
assert.ok(commandPlan.some((command) => command.commandId === 'brave-live-api-call' && command.allowedInPhase49K === false))
assert.ok(commandPlan.every((command) => command.commandId !== 'brave-live-api-call' || command.commandString === null))

const iamPlan = buildBraveFixtureIamPlan()
assert.equal(iamPlan.length, 2)
assert.ok(iamPlan.every((binding) => binding.reportOnly))
assert.ok(iamPlan.every((binding) => binding.role === 'roles/storage.objectCreator'))
assert.ok(iamPlan.every((binding) => binding.conditionExpression.includes('/activation-web-search/phase49k/')))

for (const doc of braveSearchFixtureRequiredDocs) assert.ok(existsSync(doc), `missing ${doc}`)
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>
for (const script of braveSearchFixtureRequiredScripts) assert.ok(scripts[script], `missing script ${script}`)

const policyText = [
  'server/activation/brave-search-fixture-normalizer/brave-source-storage-policy.ts',
  'docs/activation-brave-search-fixture-normalizer-policy.md',
  'docs/activation-brave-search-fallback-policy.md',
].map((file) => existsSync(file) ? readFileSync(file, 'utf8') : '').join('\n')
assert.ok(!/BRAVE_SEARCH_API_KEY\s*=\s*["'][^"']+["']/.test(policyText), 'must not contain a Brave API key value')

const report = buildBraveSearchFixtureNormalizerReport()
assert.equal(report.phase, '49K')
assert.equal(report.braveEnabledByDefault, false)
assert.equal(report.braveLiveApiAllowed, false)
assert.equal(report.paidProviderAllowed, false)
assert.equal(report.rawBraveStorageAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadMediaAllowed, false)
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), braveSearchFixtureQaGateIds)
assert.equal(report.qa.gates.every((gate) => gate.passed), true)
assert.equal(report.phase49LReadiness, 'ready_for_brave_controlled_live_api_validation')

console.log('Phase 49K Brave Search fixture normalizer smoke passed.')
