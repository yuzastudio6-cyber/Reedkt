import { existsSync, readFileSync } from 'node:fs'
import { buildWebSearchRegressionMatrix } from './web-search-regression-scenarios'
import { webSearchRegressionConfig, webSearchRegressionSafetyFlags } from './web-search-regression-policy'
import { buildWebSearchRegressionQaSummary } from './web-search-regression-qa-summary'
import type {
  WebSearchFailClosedPolicyVerification,
  WebSearchPhase49NEvidence,
  WebSearchRegressionExecutionReport,
  WebSearchRegressionMatrix,
  WebSearchRegressionReport,
} from './web-search-regression-types'

export const WEB_SEARCH_REGRESSION_LOCAL_REPORT_PATH = 'activation-logs/web-search-regression-suite/phase49o/job-execution/phase49o-report.json'

export function buildWebSearchRegressionReport(): WebSearchRegressionReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const matrix = buildWebSearchRegressionMatrix()
  const phase49nEvidence = plannedPhase49NEvidence()
  const failClosedPolicy = buildFailClosedPolicyVerification(matrix)
  const qa = buildWebSearchRegressionQaSummary({
    phase49nEvidence,
    matrix,
    failClosedPolicy,
    artifacts: [],
    executionBlockers: ['Phase 49O execution has not run yet.'],
  })
  return {
    reportId: 'activation-phase-49o-web-search-regression-suite',
    createdAt: new Date().toISOString(),
    phase: '49O',
    status: 'planned',
    config: webSearchRegressionConfig,
    phase49nEvidence,
    matrix,
    failClosedPolicy,
    qa,
    safetyFlags: webSearchRegressionSafetyFlags,
    phase49PReadiness: 'blocked_until_phase49o_execution_passes',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeWebSearchRegressionReport(report: WebSearchRegressionReport): string {
  return [
    'Phase 49O web search regression/failure suite',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Scenario matrix: ${report.matrix.passedCount}/${report.matrix.scenarioCount} passed`,
    `Phase 49N evidence: ${report.phase49nEvidence.status}`,
    `Phase49P readiness: ${report.phase49PReadiness}`,
    `Production/external beta/broad media: blocked`,
    `Paid provider expansion/public SearXNG/broad crawling: blocked`,
    '',
    'Scenario summary:',
    ...report.matrix.summaryByCategory.map((entry) => `- ${entry.category}: ${entry.passedCount}/${entry.scenarioCount} passed`),
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

export function buildFailClosedPolicyVerification(matrix: WebSearchRegressionMatrix): WebSearchFailClosedPolicyVerification {
  const unsafeScenarioFailures = matrix.scenarios.filter((scenario) => scenario.expectedResult === 'fail_closed' && scenario.actualResult !== 'fail_closed').length
  return {
    failClosed: true,
    noLiveProviderFallback: true,
    noPublicSearxngFallback: true,
    noOtherPaidProviderFallback: true,
    noArbitraryCaptureFallback: true,
    noSignedUrlSourceOfTruth: true,
    noProductionBetaUnlock: true,
    scenarioCount: matrix.scenarioCount,
    unsafeScenarioFailures,
    blockers: unsafeScenarioFailures === 0 ? [] : [`${unsafeScenarioFailures} unsafe scenarios did not fail closed.`],
    warnings: ['Fail-closed verification is deterministic and does not execute live providers or browser tooling.'],
  }
}

function executionToReport(executionReport: WebSearchRegressionExecutionReport): WebSearchRegressionReport {
  return {
    reportId: 'activation-phase-49o-web-search-regression-suite',
    createdAt: new Date().toISOString(),
    phase: '49O',
    status: executionReport.ok ? 'completed' : 'blocked',
    config: executionReport.config,
    executionReport,
    phase49nEvidence: executionReport.phase49nEvidence,
    matrix: executionReport.matrix,
    failClosedPolicy: executionReport.failClosedPolicy,
    qa: executionReport.qa,
    safetyFlags: webSearchRegressionSafetyFlags,
    phase49PReadiness: executionReport.phase49PReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function readLocalExecutionReport(): WebSearchRegressionExecutionReport | undefined {
  if (!existsSync(WEB_SEARCH_REGRESSION_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(WEB_SEARCH_REGRESSION_LOCAL_REPORT_PATH, 'utf8')) as WebSearchRegressionExecutionReport
  } catch {
    return undefined
  }
}

function plannedPhase49NEvidence(): WebSearchPhase49NEvidence {
  return {
    runId: webSearchRegressionConfig.canonicalPhase49NRunId,
    status: 'not_verified',
    readinessReportUri: `gs://${webSearchRegressionConfig.qaBucket}/activation-web-search/phase49n/${webSearchRegressionConfig.canonicalPhase49NRunId}/reports/phase49n-report.json`,
    readinessManifestUri: `gs://${webSearchRegressionConfig.generatedAssetsBucket}/activation-web-search/phase49n/${webSearchRegressionConfig.canonicalPhase49NRunId}/readiness/search-provider-readiness-manifest.json`,
    gcsVerified: false,
    blockers: ['Phase 49O execution has not verified canonical Phase 49N private GCS evidence yet.'],
    warnings: [],
  }
}
