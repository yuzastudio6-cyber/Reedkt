import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  braveSearchFallbackConfig,
  braveSearchQaGateIds,
  braveSearchRequiredDocs,
  braveSearchRequiredScripts,
  buildBraveSearchCommandPlan,
  buildBraveSearchCostPolicy,
  buildBraveSearchFallbackPolicyReport,
  buildBraveSearchProviderEvidence,
  buildBraveSearchSecretPolicy,
  buildBraveSearchStorageRightsPolicy,
  buildSearchProviderRouterPolicy,
  scoreSearxngConfidence,
} from '../activation/brave-search-fallback-policy'

assert.equal(braveSearchFallbackConfig.phase, '49J')
assert.equal(braveSearchFallbackConfig.defaultProvider, 'searxng')
assert.equal(braveSearchFallbackConfig.optionalProvider, 'brave_search')
assert.equal(braveSearchFallbackConfig.defaultProviderMode, 'searxng_only')

const evidence = buildBraveSearchProviderEvidence()
assert.equal(evidence.endpoint, 'https://api.search.brave.com/res/v1/web/search')
assert.equal(evidence.apiAuthHeader, 'X-Subscription-Token')
assert.equal(evidence.defaultEnabled, false)
assert.equal(evidence.requiresSecret, true)
assert.equal(evidence.secretName, 'BRAVE_SEARCH_API_KEY')
assert.equal(evidence.providerAllowedInPhase49J, false)
assert.equal(evidence.liveApiCallAllowedInPhase49J, false)
assert.equal(evidence.rawResponseStorageAllowedByDefault, false)
assert.ok(evidence.searchPlanPrice.includes('$5'))
assert.ok(evidence.freeCreditsSummary.includes('$5'))

const secretPolicy = buildBraveSearchSecretPolicy()
assert.equal(secretPolicy.frontendExposureAllowed, false)
assert.equal(secretPolicy.loggingAllowed, false)
assert.equal(secretPolicy.gitValueAllowed, false)
assert.equal(secretPolicy.missingSecretBehavior, 'provider_disabled_default_searxng_unblocked')

const costPolicy = buildBraveSearchCostPolicy()
assert.equal(costPolicy.braveSearchEnabledDefault, false)
assert.equal(costPolicy.dailyLimitDefault, 0)
assert.equal(costPolicy.monthlyBudgetUsdDefault, 0)
assert.equal(costPolicy.maxResults, 5)
assert.equal(costPolicy.maxQueriesPerRun, 1)
assert.equal(costPolicy.unboundedRetriesAllowed, false)

const storagePolicy = buildBraveSearchStorageRightsPolicy()
assert.equal(storagePolicy.storeRawBraveResponseDefault, false)
assert.equal(storagePolicy.storeBraveSnippetsDefault, false)
assert.equal(storagePolicy.rawPersistenceRequiresStorageRights, true)

const healthy = scoreSearxngConfidence({
  resultCount: 5,
  uniqueDomainCount: 4,
  officialSourceCount: 2,
  allowlistedDomainCount: 3,
  duplicateRatio: 0,
  emptySnippetRatio: 0,
  freshnessRequested: false,
  recentResultCount: 3,
  blockedDomainCount: 0,
  sourceQualityScore: 95,
})
assert.equal(healthy.confidenceLevel, 'high')
assert.equal(healthy.braveFallbackRecommended, false)

const low = scoreSearxngConfidence({
  resultCount: 1,
  uniqueDomainCount: 1,
  officialSourceCount: 0,
  allowlistedDomainCount: 0,
  duplicateRatio: 0.6,
  emptySnippetRatio: 0.7,
  freshnessRequested: true,
  recentResultCount: 0,
  blockedDomainCount: 2,
  sourceQualityScore: 20,
})
assert.equal(low.confidenceLevel, 'low')
assert.equal(low.braveFallbackRecommended, true)
assert.ok(low.reasonCodes.includes('freshness_gap'))

const routerModes = buildSearchProviderRouterPolicy()
assert.equal(routerModes.length, 4)
assert.ok(routerModes.some((mode) => mode.mode === 'searxng_only' && mode.defaultMode && mode.allowedInPhase49J))
assert.ok(routerModes.every((mode) => mode.braveExecutionAllowed === false))
assert.ok(routerModes.filter((mode) => mode.allowedInPhase49J).every((mode) => mode.mode === 'searxng_only'))

const commandPlan = buildBraveSearchCommandPlan()
assert.ok(commandPlan.some((command) => command.command === 'npm run activation:brave-search-fallback-policy:report'))
assert.ok(commandPlan.some((command) => command.commandId === 'brave-live-api-call' && command.allowedInPhase49J === false))
assert.ok(commandPlan.every((command) => command.mutatesState === false))

for (const doc of braveSearchRequiredDocs) assert.ok(existsSync(doc), `missing ${doc}`)
const scripts = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>
for (const script of braveSearchRequiredScripts) assert.ok(scripts[script], `missing script ${script}`)

const policyText = [
  'server/activation/brave-search-fallback-policy/brave-search-secret-policy.ts',
  'docs/activation-brave-search-fallback-policy.md',
  'docs/activation-brave-search-fallback-policy-runbook.md',
].map((file) => existsSync(file) ? readFileSync(file, 'utf8') : '').join('\n')
assert.ok(!/BRAVE_SEARCH_API_KEY\s*=\s*["'][^"']+["']/.test(policyText), 'must not contain a Brave API key value')

const report = buildBraveSearchFallbackPolicyReport()
assert.equal(report.status, 'completed')
assert.equal(report.defaultProvider, 'SearXNG')
assert.equal(report.braveEnabledByDefault, false)
assert.equal(report.braveLiveApiAllowed, false)
assert.equal(report.paidProviderAllowed, false)
assert.equal(report.rawBraveStorageAllowed, false)
assert.equal(report.productionReadyAllowed, false)
assert.equal(report.externalBetaAllowed, false)
assert.equal(report.broadMediaAllowed, false)
assert.equal(report.phase49KReadiness, 'ready_for_brave_shaped_fixture_and_normalizer')
assert.deepEqual(report.qa.gates.map((gate) => gate.gateId), braveSearchQaGateIds)
assert.equal(report.qa.gates.every((gate) => gate.passed), true)

console.log('Phase 49J Brave Search fallback policy smoke passed.')
