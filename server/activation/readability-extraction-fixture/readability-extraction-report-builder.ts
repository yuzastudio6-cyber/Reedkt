import { existsSync, readFileSync } from 'node:fs'
import { getApprovedReadabilityExtractionEvidence } from './approved-readability-extraction-evidence'
import { readabilityExtractionConfig } from './readability-extraction-policy'
import { buildApprovedReadabilityExtractionPlanSnapshot } from './readability-extraction-plan-snapshot'
import { buildReadabilityExtractionQaSummary } from './readability-extraction-qa-summary'
import type {
  ApprovedReadabilityExtractionEvidence,
  ReadabilityExtractionExecutionReport,
  ReadabilityExtractionReport,
} from './readability-extraction-types'

export const READABILITY_EXTRACTION_LOCAL_REPORT_PATH = 'activation-logs/readability-extraction-fixture/phase49d/job-execution/phase49d-report.json'

export function buildReadabilityExtractionReport(): ReadabilityExtractionReport {
  const approvedEvidence = getApprovedReadabilityExtractionEvidence()
  const executionReport = readLocalExecutionReport()
  const runId = executionReport?.runId ?? approvedEvidence.runId ?? 'phase49d-planned'
  const planSnapshot = executionReport?.planSnapshot ?? buildApprovedReadabilityExtractionPlanSnapshot(runId)
  const qa = executionReport?.qa ?? buildReadabilityExtractionQaSummary({ planSnapshot })
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
    reportId: 'activation-phase-49d-readability-extraction-fixture',
    createdAt: new Date().toISOString(),
    phase: '49D',
    status,
    config: readabilityExtractionConfig,
    approvedEvidence,
    executionReport,
    qa,
    phase49EReadiness: executionReport?.phase49EReadiness ?? approvedEvidence.phase49EReadiness,
    blockers,
    warnings,
    liveSearchAllowed: false,
    publicWebExtractionAllowed: false,
    browserCaptureAllowed: false,
    readabilityExtractionLimitedToLocalFixture: true,
    paidProviderAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealMediaAllowed: false,
  }
}

export function summarizeReadabilityExtractionReport(report: ReadabilityExtractionReport): string {
  return [
    `Phase 49D Readability extraction fixture report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Mode: ${report.config.fixtureMode}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not_run'}`,
    `Readability limited to local fixture: ${report.readabilityExtractionLimitedToLocalFixture}`,
    `Live search allowed: ${report.liveSearchAllowed}`,
    `Public web extraction allowed: ${report.publicWebExtractionAllowed}`,
    `Browser capture allowed: ${report.browserCaptureAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Phase49E readiness: ${report.phase49EReadiness}`,
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

export function readabilityExtractionEvidenceToTypeScript(evidence: ApprovedReadabilityExtractionEvidence): string {
  return `import type { ApprovedReadabilityExtractionEvidence } from './readability-extraction-types'
import { readabilityExtractionConfig } from './readability-extraction-policy'

export const approvedReadabilityExtractionEvidence: ApprovedReadabilityExtractionEvidence = ${JSON.stringify(evidence, null, 2)
    .replace('"fixtureMode": "generated_local_html_readability_extraction"', '"fixtureMode": readabilityExtractionConfig.fixtureMode')}

export function getApprovedReadabilityExtractionEvidence(): ApprovedReadabilityExtractionEvidence {
  return {
    ...approvedReadabilityExtractionEvidence,
    blockers: [...approvedReadabilityExtractionEvidence.blockers],
    warnings: [...approvedReadabilityExtractionEvidence.warnings],
  }
}
`
}

function readLocalExecutionReport(): ReadabilityExtractionExecutionReport | undefined {
  if (!existsSync(READABILITY_EXTRACTION_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(READABILITY_EXTRACTION_LOCAL_REPORT_PATH, 'utf8')) as ReadabilityExtractionExecutionReport
  } catch {
    return undefined
  }
}
