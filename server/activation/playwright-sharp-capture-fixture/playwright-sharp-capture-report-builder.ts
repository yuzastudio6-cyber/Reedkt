import { existsSync, readFileSync } from 'node:fs'
import { getApprovedPlaywrightSharpCaptureEvidence } from './approved-playwright-sharp-capture-evidence'
import { playwrightSharpCaptureConfig } from './playwright-sharp-capture-policy'
import { buildApprovedPlaywrightSharpCapturePlanSnapshot } from './playwright-sharp-capture-plan-snapshot'
import { buildPlaywrightSharpCaptureQaSummary } from './playwright-sharp-capture-qa-summary'
import type {
  ApprovedPlaywrightSharpCaptureEvidence,
  PlaywrightSharpCaptureExecutionReport,
  PlaywrightSharpCaptureReport,
} from './playwright-sharp-capture-types'

export const PLAYWRIGHT_SHARP_CAPTURE_LOCAL_REPORT_PATH = 'activation-logs/playwright-sharp-capture-fixture/phase49c/job-execution/phase49c-report.json'

export function buildPlaywrightSharpCaptureReport(): PlaywrightSharpCaptureReport {
  const approvedEvidence = getApprovedPlaywrightSharpCaptureEvidence()
  const executionReport = readLocalExecutionReport()
  const runId = executionReport?.runId ?? approvedEvidence.runId ?? 'phase49c-planned'
  const planSnapshot = executionReport?.planSnapshot ?? buildApprovedPlaywrightSharpCapturePlanSnapshot(runId)
  const qa = executionReport?.qa ?? buildPlaywrightSharpCaptureQaSummary({ planSnapshot })
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
    reportId: 'activation-phase-49c-playwright-sharp-capture-fixture',
    createdAt: new Date().toISOString(),
    phase: '49C',
    status,
    config: playwrightSharpCaptureConfig,
    approvedEvidence,
    executionReport,
    qa,
    phase49DReadiness: executionReport?.phase49DReadiness ?? approvedEvidence.phase49DReadiness,
    blockers,
    warnings,
    liveSearchAllowed: false,
    publicWebCaptureAllowed: false,
    browserCaptureLimitedToLocalFixture: true,
    readabilityExtractionAllowed: false,
    paidProviderAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealMediaAllowed: false,
  }
}

export function summarizePlaywrightSharpCaptureReport(report: PlaywrightSharpCaptureReport): string {
  return [
    `Phase 49C Playwright + Sharp capture fixture report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Mode: ${report.config.fixtureMode}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not_run'}`,
    `Browser capture limited to local fixture: ${report.browserCaptureLimitedToLocalFixture}`,
    `Live search allowed: ${report.liveSearchAllowed}`,
    `Public web capture allowed: ${report.publicWebCaptureAllowed}`,
    `Readability extraction allowed: ${report.readabilityExtractionAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Phase49D readiness: ${report.phase49DReadiness}`,
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

export function playwrightSharpCaptureEvidenceToTypeScript(evidence: ApprovedPlaywrightSharpCaptureEvidence): string {
  return `import type { ApprovedPlaywrightSharpCaptureEvidence } from './playwright-sharp-capture-types'
import { playwrightSharpCaptureConfig } from './playwright-sharp-capture-policy'

export const approvedPlaywrightSharpCaptureEvidence: ApprovedPlaywrightSharpCaptureEvidence = ${JSON.stringify(evidence, null, 2)
    .replace('"fixtureMode": "generated_local_html_capture"', '"fixtureMode": playwrightSharpCaptureConfig.fixtureMode')}

export function getApprovedPlaywrightSharpCaptureEvidence(): ApprovedPlaywrightSharpCaptureEvidence {
  return {
    ...approvedPlaywrightSharpCaptureEvidence,
    blockers: [...approvedPlaywrightSharpCaptureEvidence.blockers],
    warnings: [...approvedPlaywrightSharpCaptureEvidence.warnings],
  }
}
`
}

function readLocalExecutionReport(): PlaywrightSharpCaptureExecutionReport | undefined {
  if (!existsSync(PLAYWRIGHT_SHARP_CAPTURE_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(PLAYWRIGHT_SHARP_CAPTURE_LOCAL_REPORT_PATH, 'utf8')) as PlaywrightSharpCaptureExecutionReport
  } catch {
    return undefined
  }
}
