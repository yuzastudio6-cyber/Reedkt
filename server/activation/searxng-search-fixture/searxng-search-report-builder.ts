import { existsSync, readFileSync } from 'node:fs'
import { getApprovedSearxngSearchFixtureEvidence } from './approved-searxng-search-fixture-evidence'
import { buildSearxngGeneratedFixtureResponse } from './searxng-fixture-data'
import { buildSearxngSourceManifest } from './search-source-manifest-builder'
import { normalizeSearxngFixtureResults } from './searxng-result-normalizer'
import { buildApprovedSearxngSearchPlanSnapshot } from './searxng-search-plan-snapshot'
import { searxngSearchFixtureConfig } from './searxng-search-fixture-policy'
import { buildSearxngSearchFixtureQaSummary } from './searxng-search-qa-summary'
import type {
  ApprovedSearxngSearchFixtureEvidence,
  SearxngSearchFixtureExecutionReport,
  SearxngSearchFixtureReport,
} from './searxng-search-fixture-types'

export const SEARXNG_SEARCH_FIXTURE_LOCAL_REPORT_PATH = 'activation-logs/searxng-search-fixture/phase49b/job-execution/phase49b-report.json'

export function buildSearxngSearchFixtureReport(): SearxngSearchFixtureReport {
  const approvedEvidence = getApprovedSearxngSearchFixtureEvidence()
  const executionReport = readLocalExecutionReport()
  const runId = executionReport?.runId ?? approvedEvidence.runId ?? 'phase49b-planned'
  const fixtureResponse = buildSearxngGeneratedFixtureResponse()
  const normalization = normalizeSearxngFixtureResults(fixtureResponse)
  const sourceManifest = executionReport?.sourceManifest ?? buildSearxngSourceManifest({
    query: searxngSearchFixtureConfig.query,
    sources: normalization.sources,
    normalizationWarnings: normalization.warnings,
    normalizationBlockers: normalization.blockers,
  })
  const planSnapshot = executionReport?.planSnapshot ?? buildApprovedSearxngSearchPlanSnapshot(runId)
  const qa = executionReport?.qa ?? buildSearxngSearchFixtureQaSummary({
    fixtureResponse,
    normalizedSourceCount: normalization.sources.length,
    normalizationBlockers: normalization.blockers,
    planSnapshot,
    sourceManifest,
  })
  const status = executionReport
    ? (executionReport.ok ? 'completed' : 'blocked')
    : approvedEvidence.status === 'completed'
      ? 'completed'
      : approvedEvidence.status === 'blocked'
        ? 'blocked'
        : 'planned'
  const blockers = status === 'completed'
    ? qa.blockers
    : Array.from(new Set([...approvedEvidence.blockers, ...qa.blockers]))
  const warnings = Array.from(new Set([
    ...approvedEvidence.warnings,
    ...qa.warnings,
    ...(executionReport?.warnings ?? []),
  ]))

  return {
    reportId: 'activation-phase-49b-searxng-search-fixture',
    createdAt: new Date().toISOString(),
    phase: '49B',
    status,
    config: searxngSearchFixtureConfig,
    approvedEvidence,
    executionReport,
    defaultProvider: 'searxng',
    query: searxngSearchFixtureConfig.query,
    fixtureResponse,
    normalizedSources: normalization.sources,
    sourceManifest,
    qa,
    phase49CReadiness: executionReport?.phase49CReadiness ?? approvedEvidence.phase49CReadiness,
    blockers,
    warnings,
    liveSearchAllowed: false,
    browserCaptureAllowed: false,
    paidProviderAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealMediaAllowed: false,
  }
}

export function summarizeSearxngSearchFixtureReport(report: SearxngSearchFixtureReport): string {
  return [
    `Phase 49B SearXNG search fixture report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Provider: ${report.defaultProvider}`,
    `Query: ${report.query}`,
    `Fixture results: ${report.fixtureResponse.results.length}`,
    `Normalized sources: ${report.normalizedSources.length}`,
    `Phase49C readiness: ${report.phase49CReadiness}`,
    `Live search allowed: ${report.liveSearchAllowed}`,
    `Browser capture allowed: ${report.browserCaptureAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Public artifact allowed: ${report.publicArtifactAllowed}`,
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Artifacts:',
    ...(report.executionReport?.artifacts.length
      ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`)
      : ['- none recorded locally yet']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function searxngSearchFixtureEvidenceToTypeScript(evidence: ApprovedSearxngSearchFixtureEvidence): string {
  return `import type { ApprovedSearxngSearchFixtureEvidence } from './searxng-search-fixture-types'
import { searxngSearchFixtureConfig } from './searxng-search-fixture-policy'

export const approvedSearxngSearchFixtureEvidence: ApprovedSearxngSearchFixtureEvidence = ${JSON.stringify(evidence, null, 2)
    .replace('"query": "ReeditPro open source video editing toolchain documentation"', '"query": searxngSearchFixtureConfig.query')}

export function getApprovedSearxngSearchFixtureEvidence(): ApprovedSearxngSearchFixtureEvidence {
  return {
    ...approvedSearxngSearchFixtureEvidence,
    blockers: [...approvedSearxngSearchFixtureEvidence.blockers],
    warnings: [...approvedSearxngSearchFixtureEvidence.warnings],
  }
}
`
}

function readLocalExecutionReport(): SearxngSearchFixtureExecutionReport | undefined {
  if (!existsSync(SEARXNG_SEARCH_FIXTURE_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(SEARXNG_SEARCH_FIXTURE_LOCAL_REPORT_PATH, 'utf8')) as SearxngSearchFixtureExecutionReport
  } catch {
    return undefined
  }
}
