import { existsSync, readFileSync } from 'node:fs'
import { getApprovedRemotionRenderEvidence } from './approved-remotion-render-validation-evidence'
import { remotionRenderValidationConfig } from './remotion-render-validation-policy'
import { buildRemotionRenderQaSummary } from './remotion-render-validation-qa-summary'
import type { ApprovedRemotionRenderEvidence, RemotionRenderExecutionReport, RemotionRenderValidationReport } from './remotion-render-validation-types'

export const REMOTION_RENDER_LOCAL_REPORT_PATH = 'activation-logs/remotion-render-validation/phase45b/job-execution/phase45b-report.json'

export function buildRemotionRenderValidationReport(input: {
  executionReport?: RemotionRenderExecutionReport
  reportPath?: string
} = {}): RemotionRenderValidationReport {
  const approvedEvidence = getApprovedRemotionRenderEvidence()
  const executionReport = input.executionReport ?? readRemotionRenderExecutionReport(input.reportPath ?? REMOTION_RENDER_LOCAL_REPORT_PATH)
  const qaSummary = buildRemotionRenderQaSummary(executionReport)
  const evidenceOnlyVerified = !executionReport && approvedEvidence.status === 'verified'
  const blockers = evidenceOnlyVerified
    ? approvedEvidence.blockers
    : Array.from(new Set([...(executionReport ? qaSummary.blockers : approvedEvidence.blockers), ...qaSummary.blockers]))
  const warnings = evidenceOnlyVerified
    ? approvedEvidence.warnings
    : Array.from(new Set([...approvedEvidence.warnings, ...qaSummary.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-45b-remotion-render-validation',
    createdAt: new Date().toISOString(),
    config: remotionRenderValidationConfig,
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    remotionRenderValidated: ready || approvedEvidence.status === 'verified',
    phase45CReadiness: {
      readyForOpenTimelineIoValidation: ready || approvedEvidence.phase45CReadiness.readyForOpenTimelineIoValidation,
      reason: executionReport && ready ? 'Phase 45B passed; Phase 45C may start OpenTimelineIO timeline validation only.' : approvedEvidence.phase45CReadiness.reason,
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    finalDeliveryAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    trackBAllowed: false,
  }
}

export function summarizeRemotionRenderValidationReport(report: RemotionRenderValidationReport): string {
  return [
    `Remotion render validation report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Source video: ${report.config.approvedInputVideoGcsUri}`,
    `Phase 45A preview: ${report.config.approvedPhase45APreviewGcsUri}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${report.executionReport ? 'present' : report.approvedEvidence.qaReportUri ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}` : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Blockers: ${report.blockers.length}`,
    `Remotion render validated: ${report.remotionRenderValidated}`,
    `Phase45C ready: ${report.phase45CReadiness.readyForOpenTimelineIoValidation}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Track B allowed: ${report.trackBAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Tool results:',
    `- remotion: ${report.approvedEvidence.toolResults.remotion}`,
    `- ffprobe: ${report.approvedEvidence.toolResults.ffprobe}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readRemotionRenderExecutionReport(path: string): RemotionRenderExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RemotionRenderExecutionReport
}

export function remotionRenderEvidenceToTypeScript(evidence: ApprovedRemotionRenderEvidence): string {
  return `import type { ApprovedRemotionRenderEvidence } from './remotion-render-validation-types'\n\nexport const approvedRemotionRenderEvidence: ApprovedRemotionRenderEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedRemotionRenderEvidence(): ApprovedRemotionRenderEvidence {\n  return {\n    ...approvedRemotionRenderEvidence,\n    toolResults: { ...approvedRemotionRenderEvidence.toolResults },\n    phase45CReadiness: { ...approvedRemotionRenderEvidence.phase45CReadiness },\n    blockers: [...approvedRemotionRenderEvidence.blockers],\n    warnings: [...approvedRemotionRenderEvidence.warnings],\n  }\n}\n`
}
