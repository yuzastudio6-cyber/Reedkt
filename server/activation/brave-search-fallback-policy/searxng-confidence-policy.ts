import type { SearxngConfidenceInput, SearxngConfidenceResult, SearxngConfidenceLevel } from './brave-search-fallback-types'

export function scoreSearxngConfidence(input: SearxngConfidenceInput): SearxngConfidenceResult {
  const sourceQualityScore = input.sourceQualityScore ?? 50
  const positiveScore =
    Math.min(input.resultCount, 5) * 5 +
    Math.min(input.uniqueDomainCount, 4) * 5 +
    Math.min(input.officialSourceCount, 2) * 8 +
    Math.min(input.allowlistedDomainCount, 3) * 4 +
    Math.min(input.recentResultCount, 3) * 3 +
    Math.round(Math.max(0, Math.min(sourceQualityScore, 100)) * 0.18)
  const penalties =
    Math.round(Math.max(0, Math.min(input.duplicateRatio, 1)) * 18) +
    Math.round(Math.max(0, Math.min(input.emptySnippetRatio, 1)) * 14) +
    Math.min(input.blockedDomainCount, 5) * 5 +
    (input.freshnessRequested && input.recentResultCount < 2 ? 12 : 0)

  const confidenceScore = Math.max(0, Math.min(100, positiveScore - penalties))
  const confidenceLevel = confidenceLevelForScore(confidenceScore)
  const reasonCodes = buildReasonCodes(input, confidenceScore)
  const braveFallbackRecommended = confidenceLevel === 'low' || reasonCodes.includes('freshness_gap')

  return {
    confidenceScore,
    confidenceLevel,
    braveFallbackRecommended,
    reasonCodes,
  }
}

function confidenceLevelForScore(score: number): SearxngConfidenceLevel {
  if (score >= 75) return 'high'
  if (score >= 50) return 'medium'
  return 'low'
}

function buildReasonCodes(input: SearxngConfidenceInput, score: number): string[] {
  return [
    input.resultCount === 0 ? 'no_results' : '',
    input.resultCount > 0 && input.resultCount < 3 ? 'low_result_count' : '',
    input.uniqueDomainCount < 2 ? 'low_domain_diversity' : '',
    input.officialSourceCount === 0 ? 'no_official_sources' : '',
    input.duplicateRatio > 0.4 ? 'high_duplicate_ratio' : '',
    input.emptySnippetRatio > 0.4 ? 'snippet_quality_gap' : '',
    input.freshnessRequested && input.recentResultCount < 2 ? 'freshness_gap' : '',
    input.blockedDomainCount > 0 ? 'blocked_domains_present' : '',
    score < 50 ? 'low_confidence' : '',
  ].filter(Boolean)
}
