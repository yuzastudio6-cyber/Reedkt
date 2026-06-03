import { buildBraveSearchCommandPlan } from './brave-search-command-plan'
import { buildBraveSearchCostPolicy } from './brave-search-cost-policy'
import { buildBraveSearchProviderEvidence } from './brave-search-evidence'
import { braveSearchFallbackConfig } from './brave-search-fallback-policy'
import type { BraveSearchFallbackReport } from './brave-search-fallback-types'
import { buildBraveSearchFuturePhases } from './brave-search-future-scope'
import { buildBraveSearchQaSummary } from './brave-search-qa-summary'
import { buildBraveSearchSecretPolicy } from './brave-search-secret-policy'
import { buildBraveSearchStorageRightsPolicy } from './brave-search-storage-rights-policy'
import { scoreSearxngConfidence } from './searxng-confidence-policy'
import { buildSearchProviderRouterPolicy } from './search-provider-router-policy'

export function buildBraveSearchFallbackPolicyReport(): BraveSearchFallbackReport {
  const braveEvidence = buildBraveSearchProviderEvidence()
  const costPolicy = buildBraveSearchCostPolicy()
  const secretPolicy = buildBraveSearchSecretPolicy()
  const storageRightsPolicy = buildBraveSearchStorageRightsPolicy()
  const confidenceExamples = {
    healthySearxng: scoreSearxngConfidence({
      resultCount: 5,
      uniqueDomainCount: 4,
      officialSourceCount: 2,
      allowlistedDomainCount: 3,
      duplicateRatio: 0.05,
      emptySnippetRatio: 0,
      freshnessRequested: false,
      recentResultCount: 2,
      blockedDomainCount: 0,
      sourceQualityScore: 90,
    }),
    lowConfidenceFreshness: scoreSearxngConfidence({
      resultCount: 2,
      uniqueDomainCount: 1,
      officialSourceCount: 0,
      allowlistedDomainCount: 0,
      duplicateRatio: 0.55,
      emptySnippetRatio: 0.6,
      freshnessRequested: true,
      recentResultCount: 0,
      blockedDomainCount: 1,
      sourceQualityScore: 35,
    }),
  }
  const providerRouterModes = buildSearchProviderRouterPolicy()
  const commandPlan = buildBraveSearchCommandPlan()
  const futurePhases = buildBraveSearchFuturePhases()
  const qa = buildBraveSearchQaSummary({
    evidence: braveEvidence,
    costPolicy,
    secretPolicy,
    storageRightsPolicy,
    confidenceExamples: [confidenceExamples.healthySearxng, confidenceExamples.lowConfidenceFreshness],
    providerRouterModes,
    commandPlan,
  })
  const status = qa.status === 'passed' ? 'completed' : 'blocked'
  const warnings = Array.from(new Set([
    ...qa.warnings,
    'SearXNG remains the default provider; Brave is optional, paid, disabled by default, and future-scoped.',
  ]))

  return {
    reportId: 'activation-phase-49j-brave-search-fallback-policy',
    createdAt: new Date().toISOString(),
    phase: '49J',
    status,
    config: braveSearchFallbackConfig,
    braveEvidence,
    costPolicy,
    secretPolicy,
    storageRightsPolicy,
    confidenceExamples,
    providerRouterModes,
    commandPlan,
    futurePhases,
    qa,
    phase49KReadiness: qa.status === 'passed' ? 'ready_for_brave_shaped_fixture_and_normalizer' : 'blocked',
    defaultProvider: 'SearXNG',
    braveStatus: 'optional_fallback_blocked_until_future_secret_backed_phase',
    blockers: qa.blockers,
    warnings,
    braveEnabledByDefault: false,
    braveLiveApiAllowed: false,
    paidProviderAllowed: false,
    rawBraveStorageAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
  }
}

export function summarizeBraveSearchFallbackPolicyReport(report: BraveSearchFallbackReport): string {
  return [
    'Phase 49J Brave Search fallback policy',
    `Status: ${report.status}`,
    `Default provider: ${report.defaultProvider}`,
    `Brave status: ${report.braveStatus}`,
    `Endpoint: ${report.braveEvidence.endpoint}`,
    `Auth header: ${report.braveEvidence.apiAuthHeader}`,
    `Pricing evidence: ${report.braveEvidence.searchPlanPrice}; ${report.braveEvidence.freeCreditsSummary}`,
    `SearXNG healthy confidence: ${report.confidenceExamples.healthySearxng.confidenceLevel} (${report.confidenceExamples.healthySearxng.confidenceScore})`,
    `SearXNG low confidence example: ${report.confidenceExamples.lowConfidenceFreshness.confidenceLevel} (${report.confidenceExamples.lowConfidenceFreshness.confidenceScore})`,
    `Phase49K readiness: ${report.phase49KReadiness}`,
    `Live Brave API allowed: ${report.braveLiveApiAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Raw Brave storage allowed: ${report.rawBraveStorageAllowed}`,
    `Production/external beta/broad media: blocked`,
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function summarizeBraveSearchProviderPolicy(): string {
  const report = buildBraveSearchFallbackPolicyReport()
  return [
    'Brave Search provider policy summary',
    `Default provider: ${report.defaultProvider}`,
    'Brave Search API: optional paid fallback/confidence booster only',
    `Brave enabled by default: ${report.braveEnabledByDefault}`,
    `Live Brave API allowed in Phase 49J: ${report.braveLiveApiAllowed}`,
    `Secret name: ${report.secretPolicy.secretName} (name only; no value)`,
    `Cost defaults: daily=${report.costPolicy.dailyLimitDefault}, monthlyUsd=${report.costPolicy.monthlyBudgetUsdDefault}, maxResults=${report.costPolicy.maxResults}`,
    `Raw response storage allowed: ${report.rawBraveStorageAllowed}`,
    `Provider modes: ${report.providerRouterModes.map((mode) => `${mode.mode}${mode.defaultMode ? ' (default)' : ''}`).join(', ')}`,
    `Phase49K readiness: ${report.phase49KReadiness}`,
  ].join('\n')
}
