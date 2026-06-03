import { existsSync, readFileSync } from 'node:fs'
import { buildBraveShapedFixtureResponse } from './brave-shaped-fixture-data'
import { buildBraveFixtureSourceManifest } from './brave-fixture-source-manifest-builder'
import { buildBraveFixturePlanSnapshot, braveSearchFixtureConfig } from './brave-search-fixture-policy'
import { buildBraveFixtureQaSummary } from './brave-fixture-qa-summary'
import { normalizeBraveFixtureResults } from './brave-result-normalizer'
import { buildSearchProviderRouterFixtureDecisions } from './search-provider-router-fixture'
import { buildSearchResultDedupeFixture } from './search-result-dedupe'
import { buildSearxngConfidenceFixtureScenarios } from './search-confidence-fixture-runner'
import type { BraveFixtureExecutionReport, BraveSearchFixtureReport } from './brave-search-fixture-types'

export const BRAVE_FIXTURE_LOCAL_REPORT_PATH = 'activation-logs/brave-search-fixture-normalizer/phase49k/job-execution/phase49k-report.json'

export function buildBraveSearchFixtureNormalizerReport(): BraveSearchFixtureReport {
  const executionReport = readLocalExecutionReport()
  const runId = executionReport?.runId ?? 'phase49k-planned'
  const fixtureResponse = executionReport?.fixtureResponse ?? buildBraveShapedFixtureResponse()
  const normalization = normalizeBraveFixtureResults(fixtureResponse)
  const confidenceScenarios = executionReport?.confidenceScenarios ?? buildSearxngConfidenceFixtureScenarios()
  const routerDecisions = executionReport?.routerDecisions ?? buildSearchProviderRouterFixtureDecisions(confidenceScenarios)
  const dedupeFixture = executionReport?.dedupeFixture ?? buildSearchResultDedupeFixture(normalization.sources)
  const sourceManifest = executionReport?.sourceManifest ?? buildBraveFixtureSourceManifest({
    runId,
    sources: normalization.sources,
    confidenceScenarios,
    routerDecisions,
    dedupeFixture,
    normalizationWarnings: normalization.warnings,
    normalizationBlockers: normalization.blockers,
  })
  const planSnapshot = executionReport?.planSnapshot ?? buildBraveFixturePlanSnapshot(runId)
  const qa = executionReport?.qa ?? buildBraveFixtureQaSummary({
    fixtureResponse,
    normalizedSources: normalization.sources,
    normalizationBlockers: normalization.blockers,
    planSnapshot,
    sourceManifest,
    confidenceScenarios,
    routerDecisions,
    dedupeFixture,
  })
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : 'planned'
  const blockers = status === 'completed' ? qa.blockers : Array.from(new Set([...qa.blockers, ...(executionReport?.blockers ?? [])]))
  const warnings = Array.from(new Set([...qa.warnings, ...(executionReport?.warnings ?? [])]))

  return {
    reportId: 'activation-phase-49k-brave-search-fixture-normalizer',
    createdAt: new Date().toISOString(),
    phase: '49K',
    status,
    config: braveSearchFixtureConfig,
    executionReport,
    fixtureResponse,
    normalizedSources: executionReport?.normalizedSources ?? normalization.sources,
    confidenceScenarios,
    routerDecisions,
    dedupeFixture,
    sourceManifest,
    qa,
    phase49LReadiness: qa.status === 'passed' ? 'ready_for_brave_controlled_live_api_validation' : 'blocked',
    blockers,
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

export function summarizeBraveSearchFixtureNormalizerReport(report: BraveSearchFixtureReport): string {
  return [
    `Phase 49K Brave Search fixture normalizer report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Provider: ${report.config.provider}`,
    `Query: ${report.config.query}`,
    `Fixture results: ${report.fixtureResponse.web.results.length}`,
    `Normalized sources: ${report.normalizedSources.length}`,
    `Confidence scenarios: ${report.confidenceScenarios.map((scenario) => `${scenario.scenarioId}=${scenario.result.braveFallbackRecommended ? 'fallback_recommended' : 'no_fallback'}`).join(', ')}`,
    `Router modes: ${report.routerDecisions.map((decision) => `${decision.mode}:${decision.providerExecutionAllowed ? 'execute' : 'planning_only'}`).join(', ')}`,
    `Dedupe duplicate groups: ${report.dedupeFixture.duplicateGroups.length}`,
    `Phase49L readiness: ${report.phase49LReadiness}`,
    `Live Brave API allowed: ${report.braveLiveApiAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Raw Brave storage allowed: ${report.rawBraveStorageAllowed}`,
    `Production/external beta/broad media: blocked`,
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Artifacts:',
    ...(report.executionReport?.artifacts.length ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`) : ['- none recorded locally yet']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

function readLocalExecutionReport(): BraveFixtureExecutionReport | undefined {
  if (!existsSync(BRAVE_FIXTURE_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(BRAVE_FIXTURE_LOCAL_REPORT_PATH, 'utf8')) as BraveFixtureExecutionReport
  } catch {
    return undefined
  }
}
