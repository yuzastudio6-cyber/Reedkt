import { existsSync, readFileSync } from 'node:fs'
import { getApprovedFinalRenderHardeningEvidence } from './approved-final-render-hardening-evidence'
import { finalRenderHardeningConfig } from './final-render-hardening-policy'
import { buildFinalRenderHardeningQaSummary } from './final-render-hardening-qa-summary'
import type { ApprovedFinalRenderHardeningEvidence, FinalRenderHardeningExecutionReport, FinalRenderHardeningReport } from './final-render-hardening-types'

export const FINAL_RENDER_HARDENING_LOCAL_REPORT_PATH = 'activation-logs/final-render-hardening/phase45d/job-execution/phase45d-report.json'

export function buildFinalRenderHardeningReport(input: {
  executionReport?: FinalRenderHardeningExecutionReport
  reportPath?: string
} = {}): FinalRenderHardeningReport {
  const approvedEvidence = getApprovedFinalRenderHardeningEvidence()
  const executionReport = input.executionReport ?? readFinalRenderHardeningExecutionReport(input.reportPath ?? FINAL_RENDER_HARDENING_LOCAL_REPORT_PATH)
  const qaSummary = buildFinalRenderHardeningQaSummary(executionReport)
  const evidenceOnlyVerified = !executionReport && approvedEvidence.status === 'verified'
  const blockers = evidenceOnlyVerified
    ? approvedEvidence.blockers
    : Array.from(new Set([...(executionReport ? qaSummary.blockers : approvedEvidence.blockers), ...qaSummary.blockers]))
  const warnings = evidenceOnlyVerified
    ? approvedEvidence.warnings
    : Array.from(new Set([...approvedEvidence.warnings, ...qaSummary.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-45d-ffmpeg-ffprobe-final-render-hardening',
    createdAt: new Date().toISOString(),
    config: finalRenderHardeningConfig,
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    finalRenderHardeningValidated: ready || approvedEvidence.status === 'verified',
    phase45EReadiness: {
      readyForFullVisualVideoPrivateE2E: ready || approvedEvidence.phase45EReadiness.readyForFullVisualVideoPrivateE2E,
      reason: executionReport && ready ? 'Phase 45D passed; Phase 45E may start full visual-video private E2E only.' : approvedEvidence.phase45EReadiness.reason,
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

export function summarizeFinalRenderHardeningReport(report: FinalRenderHardeningReport): string {
  return [
    `Final render hardening report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Source video: ${report.config.approvedInputVideoGcsUri}`,
    `Phase 45B preview: ${report.config.approvedPhase45BPreviewGcsUri}`,
    `Phase 45C OTIO: ${report.config.approvedPhase45COtioGcsUri}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${report.executionReport ? 'present' : report.approvedEvidence.qaReportUri ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}` : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Blockers: ${report.blockers.length}`,
    `FFmpeg/FFprobe hardening validated: ${report.finalRenderHardeningValidated}`,
    `Phase45E ready: ${report.phase45EReadiness.readyForFullVisualVideoPrivateE2E}`,
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
    `- ffmpeg: ${report.approvedEvidence.toolResults.ffmpeg}`,
    `- ffprobe: ${report.approvedEvidence.toolResults.ffprobe}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readFinalRenderHardeningExecutionReport(path: string): FinalRenderHardeningExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as FinalRenderHardeningExecutionReport
}

export function finalRenderHardeningEvidenceToTypeScript(evidence: ApprovedFinalRenderHardeningEvidence): string {
  return `import type { ApprovedFinalRenderHardeningEvidence } from './final-render-hardening-types'\n\nexport const approvedFinalRenderHardeningEvidence: ApprovedFinalRenderHardeningEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedFinalRenderHardeningEvidence(): ApprovedFinalRenderHardeningEvidence {\n  return {\n    ...approvedFinalRenderHardeningEvidence,\n    toolResults: { ...approvedFinalRenderHardeningEvidence.toolResults },\n    phase45EReadiness: { ...approvedFinalRenderHardeningEvidence.phase45EReadiness },\n    blockers: [...approvedFinalRenderHardeningEvidence.blockers],\n    warnings: [...approvedFinalRenderHardeningEvidence.warnings],\n  }\n}\n`
}
