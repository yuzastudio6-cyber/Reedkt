import type { BraveSearchProviderMode } from '../brave-search-fallback-policy'
import type { SearchProviderRouterFixtureDecision, SearxngConfidenceFixtureScenario } from './brave-search-fixture-types'

export function buildSearchProviderRouterFixtureDecisions(scenarios: SearxngConfidenceFixtureScenario[]): SearchProviderRouterFixtureDecision[] {
  const lowConfidence = scenarios.some((scenario) => scenario.result.braveFallbackRecommended)
  return [
    decision('searxng_only', 'searxng', false, false, false, false, 'Default mode. SearXNG remains the only execution-capable provider.'),
    decision('searxng_with_brave_fallback', 'searxng', lowConfidence, true, true, true, 'Planning-only fallback recommendation. Brave execution remains blocked.'),
    decision('hybrid_consensus', 'searxng_plus_brave', lowConfidence, true, true, true, 'Planning-only consensus mode for future SearXNG plus Brave comparison.'),
    decision('brave_only_diagnostic', 'brave_search', true, true, true, true, 'Future admin diagnostic mode only; blocked in Phase 49K.'),
  ]
}

function decision(
  mode: BraveSearchProviderMode,
  selectedProvider: SearchProviderRouterFixtureDecision['selectedProvider'],
  fallbackRecommended: boolean,
  budgetRequired: boolean,
  secretRequired: boolean,
  storageRightsRequired: boolean,
  fallbackBlockedReason: string,
): SearchProviderRouterFixtureDecision {
  return {
    mode,
    selectedProvider,
    fallbackRecommended,
    fallbackBlockedReason,
    providerExecutionAllowed: false,
    budgetRequired,
    secretRequired,
    storageRightsRequired,
    planningOnly: true,
  }
}
