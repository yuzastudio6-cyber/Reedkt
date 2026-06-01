import { existsSync, readFileSync } from 'node:fs'
import { getApprovedFullVisualVideoPrivateE2eEvidence } from './approved-full-visual-video-private-e2e-evidence'
import { fullVisualVideoPrivateE2eConfig } from './full-visual-video-private-e2e-policy'
import { buildFullVisualVideoPrivateE2eQaSummary } from './full-visual-video-private-e2e-qa-summary'
import type { ApprovedFullVisualVideoPrivateE2eEvidence, FullVisualVideoPrivateE2eExecutionReport, FullVisualVideoPrivateE2eReport } from './full-visual-video-private-e2e-types'

export const FULL_VISUAL_VIDEO_PRIVATE_E2E_LOCAL_REPORT_PATH = 'activation-logs/full-visual-video-private-e2e/phase45e/job-execution/phase45e-report.json'

export function buildFullVisualVideoPrivateE2eReport(input: {
  executionReport?: FullVisualVideoPrivateE2eExecutionReport
  reportPath?: string
} = {}): FullVisualVideoPrivateE2eReport {
  const approvedEvidence = getApprovedFullVisualVideoPrivateE2eEvidence()
  const executionReport = input.executionReport ?? readFullVisualVideoPrivateE2eExecutionReport(input.reportPath ?? FULL_VISUAL_VIDEO_PRIVATE_E2E_LOCAL_REPORT_PATH)
  const qaSummary = buildFullVisualVideoPrivateE2eQaSummary(executionReport)
  const evidenceOnlyVerified = !executionReport && approvedEvidence.status === 'verified'
  const blockers = evidenceOnlyVerified
    ? approvedEvidence.blockers
    : Array.from(new Set([...(executionReport ? qaSummary.blockers : approvedEvidence.blockers), ...qaSummary.blockers]))
  const warnings = evidenceOnlyVerified
    ? approvedEvidence.warnings
    : Array.from(new Set([...approvedEvidence.warnings, ...qaSummary.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-45e-full-visual-video-private-e2e',
    createdAt: new Date().toISOString(),
    config: fullVisualVideoPrivateE2eConfig,
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    fullVisualVideoPrivateE2eValidated: ready || approvedEvidence.status === 'verified',
    trackAVisualVideoReadiness: {
      readyForInternalPrivateVisualVideoTesting: ready || approvedEvidence.trackAVisualVideoReadiness.readyForInternalPrivateVisualVideoTesting,
      reason: executionReport && ready ? 'Phase 45E passed; Track A visual-video is ready for internal private visual-video testing only.' : approvedEvidence.trackAVisualVideoReadiness.reason,
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    finalDeliveryAllowed: false,
    privateReviewOnly: true,
    providerAllowed: false,
    revideoAllowed: false,
    trackBAllowed: false,
  }
}

export function summarizeFullVisualVideoPrivateE2eReport(report: FullVisualVideoPrivateE2eReport): string {
  return [
    `Full visual-video private E2E report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Source video: ${report.config.approvedInputVideoGcsUri}`,
    `Canonical private review export: ${report.config.approvedPhase45DReviewExportGcsUri}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${report.executionReport ? 'present' : report.approvedEvidence.qaReportUri ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}` : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Blockers: ${report.blockers.length}`,
    `Full visual-video private E2E validated: ${report.fullVisualVideoPrivateE2eValidated}`,
    `Track A internal private testing ready: ${report.trackAVisualVideoReadiness.readyForInternalPrivateVisualVideoTesting}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    `Private review only: ${report.privateReviewOnly}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Track B allowed: ${report.trackBAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Tool results:',
    `- evidencePackage: ${report.approvedEvidence.toolResults.evidencePackage}`,
    `- ffprobe: ${report.approvedEvidence.toolResults.ffprobe}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readFullVisualVideoPrivateE2eExecutionReport(path: string): FullVisualVideoPrivateE2eExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as FullVisualVideoPrivateE2eExecutionReport
}

export function fullVisualVideoPrivateE2eEvidenceToTypeScript(evidence: ApprovedFullVisualVideoPrivateE2eEvidence): string {
  return `import type { ApprovedFullVisualVideoPrivateE2eEvidence } from './full-visual-video-private-e2e-types'\n\nexport const approvedFullVisualVideoPrivateE2eEvidence: ApprovedFullVisualVideoPrivateE2eEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedFullVisualVideoPrivateE2eEvidence(): ApprovedFullVisualVideoPrivateE2eEvidence {\n  return {\n    ...approvedFullVisualVideoPrivateE2eEvidence,\n    toolResults: { ...approvedFullVisualVideoPrivateE2eEvidence.toolResults },\n    trackAVisualVideoReadiness: { ...approvedFullVisualVideoPrivateE2eEvidence.trackAVisualVideoReadiness },\n    blockers: [...approvedFullVisualVideoPrivateE2eEvidence.blockers],\n    warnings: [...approvedFullVisualVideoPrivateE2eEvidence.warnings],\n  }\n}\n`
}
