import { scoreSearxngConfidence } from '../brave-search-fallback-policy'
import type { SearxngConfidenceFixtureScenario } from './brave-search-fixture-types'

export function buildSearxngConfidenceFixtureScenarios(): SearxngConfidenceFixtureScenario[] {
  return [
    scenario('searxng_high_confidence', 'SearXNG has enough diverse and official results.', {
      resultCount: 5,
      uniqueDomainCount: 4,
      officialSourceCount: 2,
      allowlistedDomainCount: 3,
      duplicateRatio: 0.05,
      emptySnippetRatio: 0,
      freshnessRequested: false,
      recentResultCount: 3,
      blockedDomainCount: 0,
      sourceQualityScore: 94,
    }, false),
    scenario('searxng_low_confidence', 'SearXNG has low count, duplicate domains, and weak snippets.', {
      resultCount: 1,
      uniqueDomainCount: 1,
      officialSourceCount: 0,
      allowlistedDomainCount: 0,
      duplicateRatio: 0.65,
      emptySnippetRatio: 0.65,
      freshnessRequested: false,
      recentResultCount: 0,
      blockedDomainCount: 1,
      sourceQualityScore: 30,
    }, true),
    scenario('searxng_freshness_gap', 'SearXNG freshness was requested but recent evidence is insufficient.', {
      resultCount: 3,
      uniqueDomainCount: 2,
      officialSourceCount: 1,
      allowlistedDomainCount: 1,
      duplicateRatio: 0.2,
      emptySnippetRatio: 0.1,
      freshnessRequested: true,
      recentResultCount: 0,
      blockedDomainCount: 0,
      sourceQualityScore: 55,
    }, true),
  ]
}

function scenario(
  scenarioId: SearxngConfidenceFixtureScenario['scenarioId'],
  summary: string,
  input: SearxngConfidenceFixtureScenario['input'],
  expectedFallbackRecommended: boolean,
): SearxngConfidenceFixtureScenario {
  const result = scoreSearxngConfidence(input)
  return {
    scenarioId,
    summary,
    input,
    result: {
      ...result,
      braveExecutionAllowed: false,
      fallbackBlockedReason: 'Phase 49K may recommend Brave fallback planning, but live Brave execution is blocked until Phase 49L approval.',
    },
    expectedFallbackRecommended,
  }
}
