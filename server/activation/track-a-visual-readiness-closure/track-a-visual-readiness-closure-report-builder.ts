import { existsSync, readFileSync } from 'node:fs'
import { getApprovedTrackAVisualReadinessClosureEvidence } from './approved-track-a-visual-readiness-closure-evidence'
import { buildTrackAVisualEvidenceChain } from './track-a-visual-evidence-resolver'
import { trackAVisualReadinessConfig } from './track-a-visual-readiness-closure-policy'
import { buildTrackAVisualReadinessClosureQaSummary } from './track-a-visual-readiness-closure-qa-summary'
import type {
  ApprovedTrackAVisualReadinessClosureEvidence,
  TrackAVisualReadinessClosureReport,
  TrackAVisualReadinessExecutionReport,
} from './track-a-visual-readiness-closure-types'

export const TRACK_A_VISUAL_READINESS_LOCAL_REPORT_PATH = 'activation-logs/track-a-visual-readiness-closure/phase45f/job-execution/phase45f-report.json'

export function buildTrackAVisualReadinessClosureReport(input: {
  executionReport?: TrackAVisualReadinessExecutionReport
  reportPath?: string
} = {}): TrackAVisualReadinessClosureReport {
  const approvedEvidence = getApprovedTrackAVisualReadinessClosureEvidence()
  const executionReport = input.executionReport ?? readTrackAVisualReadinessClosureExecutionReport(input.reportPath ?? TRACK_A_VISUAL_READINESS_LOCAL_REPORT_PATH)
  const evidenceChain = executionReport?.evidenceChain ?? buildTrackAVisualEvidenceChain()
  const qaSummary = executionReport?.qa ?? buildTrackAVisualReadinessClosureQaSummary()
  const evidenceOnlyVerified = !executionReport && approvedEvidence.status === 'verified'
  const blockers = evidenceOnlyVerified
    ? approvedEvidence.blockers
    : Array.from(new Set([...(executionReport ? qaSummary.blockers : approvedEvidence.blockers), ...qaSummary.blockers]))
  const warnings = evidenceOnlyVerified
    ? approvedEvidence.warnings
    : Array.from(new Set([...approvedEvidence.warnings, ...qaSummary.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-45f-track-a-visual-video-readiness-closure',
    createdAt: new Date().toISOString(),
    config: trackAVisualReadinessConfig,
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    evidenceChain,
    blockers,
    warnings,
    trackAInternalReadiness: {
      readyForInternalPrivateVisualVideoTesting: ready || approvedEvidence.trackAInternalReadiness.readyForInternalPrivateVisualVideoTesting,
      reason: executionReport && ready
        ? 'Phase 45F passed; Track A visual-video is ready for internal private visual-video testing only.'
        : approvedEvidence.trackAInternalReadiness.reason,
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

export function summarizeTrackAVisualReadinessClosureReport(report: TrackAVisualReadinessClosureReport): string {
  return [
    `Track A visual-video readiness closure report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Approved Phase 45E run: ${report.config.approvedPhase45ERunId}`,
    `Canonical private review export: ${report.config.canonicalPrivateReviewExportGcsUri}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${report.executionReport ? 'present' : report.approvedEvidence.qaReportUri ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}` : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Blockers: ${report.blockers.length}`,
    `Track A internal private testing ready: ${report.trackAInternalReadiness.readyForInternalPrivateVisualVideoTesting}`,
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
    'Evidence chain:',
    ...report.evidenceChain.map((item) => `- ${item.phase} ${item.label}: ${item.status}; internalReady=${item.readyForInternalTrackA}; expectedScopeBlockers=${item.expectedScopeBlockers.length}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readTrackAVisualReadinessClosureExecutionReport(path: string): TrackAVisualReadinessExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as TrackAVisualReadinessExecutionReport
}

export function trackAVisualReadinessClosureEvidenceToTypeScript(evidence: ApprovedTrackAVisualReadinessClosureEvidence): string {
  return `import type { ApprovedTrackAVisualReadinessClosureEvidence } from './track-a-visual-readiness-closure-types'\n\nexport const approvedTrackAVisualReadinessClosureEvidence: ApprovedTrackAVisualReadinessClosureEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedTrackAVisualReadinessClosureEvidence(): ApprovedTrackAVisualReadinessClosureEvidence {\n  return {\n    ...approvedTrackAVisualReadinessClosureEvidence,\n    trackAInternalReadiness: { ...approvedTrackAVisualReadinessClosureEvidence.trackAInternalReadiness },\n    remainingTrackABlockers: [...approvedTrackAVisualReadinessClosureEvidence.remainingTrackABlockers],\n    blockers: [...approvedTrackAVisualReadinessClosureEvidence.blockers],\n    warnings: [...approvedTrackAVisualReadinessClosureEvidence.warnings],\n  }\n}\n`
}
