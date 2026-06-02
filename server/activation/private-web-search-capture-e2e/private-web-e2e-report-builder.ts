import { existsSync, readFileSync } from 'node:fs'
import { getApprovedPrivateWebE2EEvidence } from './approved-private-web-e2e-evidence'
import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import { buildPrivateWebE2EPlanSnapshot } from './private-web-e2e-plan-snapshot'
import { buildPrivateWebE2EQaSummary } from './private-web-e2e-qa-summary'
import type {
  ApprovedPrivateWebE2EEvidence,
  PrivateWebE2EExecutionReport,
  PrivateWebE2EReport,
} from './private-web-search-capture-e2e-types'

export const PRIVATE_WEB_E2E_LOCAL_REPORT_PATH = 'activation-logs/private-web-search-capture-e2e/phase49e/job-execution/phase49e-report.json'

export function buildPrivateWebE2EReport(): PrivateWebE2EReport {
  const approvedEvidence = getApprovedPrivateWebE2EEvidence()
  const executionReport = readLocalExecutionReport()
  const runId = executionReport?.runId ?? approvedEvidence.runId ?? 'phase49e-planned'
  const providerMode = executionReport?.providerMode ?? approvedEvidence.providerMode
  const planSnapshot = executionReport?.planSnapshot ?? buildPrivateWebE2EPlanSnapshot({ runId, providerMode })
  const qa = executionReport?.qa ?? buildPrivateWebE2EQaSummary({ planSnapshot })
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
    reportId: 'activation-phase-49e-private-web-search-capture-e2e',
    createdAt: new Date().toISOString(),
    phase: '49E',
    status,
    config: privateWebE2EConfig,
    approvedEvidence,
    executionReport,
    qa,
    phase49FReadiness: executionReport?.phase49FReadiness ?? approvedEvidence.phase49FReadiness,
    blockers,
    warnings,
    livePublicSearchAllowed: false,
    publicWebCaptureAllowed: false,
    arbitraryUrlCaptureAllowed: false,
    paidProviderAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealMediaAllowed: false,
  }
}

export function summarizePrivateWebE2EReport(report: PrivateWebE2EReport): string {
  return [
    `Phase 49E controlled private web search/capture E2E report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Mode: ${report.config.mode}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not_run'}`,
    `Provider mode: ${report.executionReport?.providerMode ?? report.approvedEvidence.providerMode}`,
    `Search results: ${report.executionReport?.normalizedSources.length ?? report.approvedEvidence.sourceCount ?? 0}`,
    `Captures: ${report.executionReport?.captures.length ?? report.approvedEvidence.captureCount ?? 0}`,
    `Readability extractions: ${report.executionReport?.extractions.length ?? report.approvedEvidence.extractionCount ?? 0}`,
    `Live public search allowed: ${report.livePublicSearchAllowed}`,
    `Public web capture allowed: ${report.publicWebCaptureAllowed}`,
    `Arbitrary URL capture allowed: ${report.arbitraryUrlCaptureAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Phase49F readiness: ${report.phase49FReadiness}`,
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

export function privateWebE2EEvidenceToTypeScript(evidence: ApprovedPrivateWebE2EEvidence): string {
  return `import type { ApprovedPrivateWebE2EEvidence } from './private-web-search-capture-e2e-types'

export const approvedPrivateWebE2EEvidence: ApprovedPrivateWebE2EEvidence = ${JSON.stringify(evidence, null, 2)}

export function getApprovedPrivateWebE2EEvidence(): ApprovedPrivateWebE2EEvidence {
  return {
    ...approvedPrivateWebE2EEvidence,
    blockers: [...approvedPrivateWebE2EEvidence.blockers],
    warnings: [...approvedPrivateWebE2EEvidence.warnings],
  }
}
`
}

function readLocalExecutionReport(): PrivateWebE2EExecutionReport | undefined {
  if (!existsSync(PRIVATE_WEB_E2E_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(PRIVATE_WEB_E2E_LOCAL_REPORT_PATH, 'utf8')) as PrivateWebE2EExecutionReport
  } catch {
    return undefined
  }
}
