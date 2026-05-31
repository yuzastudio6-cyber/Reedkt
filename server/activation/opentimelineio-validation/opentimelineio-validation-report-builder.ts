import { existsSync, readFileSync } from 'node:fs'
import { getApprovedOpenTimelineIoEvidence } from './approved-opentimelineio-validation-evidence'
import { openTimelineIoValidationConfig } from './opentimelineio-validation-policy'
import { buildOpenTimelineIoQaSummary } from './opentimelineio-validation-qa-summary'
import type { ApprovedOpenTimelineIoEvidence, OpenTimelineIoExecutionReport, OpenTimelineIoValidationReport } from './opentimelineio-validation-types'

export const OPENTIMELINEIO_LOCAL_REPORT_PATH = 'activation-logs/opentimelineio-validation/phase45c/job-execution/phase45c-report.json'

export function buildOpenTimelineIoValidationReport(input: {
  executionReport?: OpenTimelineIoExecutionReport
  reportPath?: string
} = {}): OpenTimelineIoValidationReport {
  const approvedEvidence = getApprovedOpenTimelineIoEvidence()
  const executionReport = input.executionReport ?? readOpenTimelineIoExecutionReport(input.reportPath ?? OPENTIMELINEIO_LOCAL_REPORT_PATH)
  const qaSummary = buildOpenTimelineIoQaSummary(executionReport)
  const evidenceOnlyVerified = !executionReport && approvedEvidence.status === 'verified'
  const blockers = evidenceOnlyVerified
    ? approvedEvidence.blockers
    : Array.from(new Set([...(executionReport ? qaSummary.blockers : approvedEvidence.blockers), ...qaSummary.blockers]))
  const warnings = evidenceOnlyVerified
    ? approvedEvidence.warnings
    : Array.from(new Set([...approvedEvidence.warnings, ...qaSummary.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-45c-opentimelineio-validation',
    createdAt: new Date().toISOString(),
    config: openTimelineIoValidationConfig,
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    opentimelineioValidated: ready || approvedEvidence.status === 'verified',
    phase45DReadiness: {
      readyForFfmpegFfprobeFinalRenderHardening: ready || approvedEvidence.phase45DReadiness.readyForFfmpegFfprobeFinalRenderHardening,
      reason: executionReport && ready ? 'Phase 45C passed; Phase 45D may start FFmpeg/FFprobe final render/export hardening only.' : approvedEvidence.phase45DReadiness.reason,
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

export function summarizeOpenTimelineIoValidationReport(report: OpenTimelineIoValidationReport): string {
  return [
    `OpenTimelineIO validation report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Source video: ${report.config.approvedInputVideoGcsUri}`,
    `Phase 45A preview: ${report.config.approvedPhase45APreviewGcsUri}`,
    `Phase 45B preview: ${report.config.approvedPhase45BPreviewGcsUri}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${report.executionReport ? 'present' : report.approvedEvidence.qaReportUri ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}` : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Blockers: ${report.blockers.length}`,
    `OpenTimelineIO validated: ${report.opentimelineioValidated}`,
    `Phase45D ready: ${report.phase45DReadiness.readyForFfmpegFfprobeFinalRenderHardening}`,
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
    `- opentimelineio: ${report.approvedEvidence.toolResults.opentimelineio}`,
    `- metadataValidation: ${report.approvedEvidence.toolResults.metadataValidation}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readOpenTimelineIoExecutionReport(path: string): OpenTimelineIoExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as OpenTimelineIoExecutionReport
}

export function openTimelineIoEvidenceToTypeScript(evidence: ApprovedOpenTimelineIoEvidence): string {
  return `import type { ApprovedOpenTimelineIoEvidence } from './opentimelineio-validation-types'\n\nexport const approvedOpenTimelineIoEvidence: ApprovedOpenTimelineIoEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedOpenTimelineIoEvidence(): ApprovedOpenTimelineIoEvidence {\n  return {\n    ...approvedOpenTimelineIoEvidence,\n    toolResults: { ...approvedOpenTimelineIoEvidence.toolResults },\n    phase45DReadiness: { ...approvedOpenTimelineIoEvidence.phase45DReadiness },\n    blockers: [...approvedOpenTimelineIoEvidence.blockers],\n    warnings: [...approvedOpenTimelineIoEvidence.warnings],\n  }\n}\n`
}
