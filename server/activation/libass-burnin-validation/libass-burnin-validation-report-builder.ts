import { existsSync, readFileSync } from 'node:fs'
import { getApprovedLibassBurninEvidence } from './approved-libass-burnin-validation-evidence'
import { libassBurninValidationConfig } from './libass-burnin-validation-policy'
import { buildLibassBurninQaSummary } from './libass-burnin-validation-qa-summary'
import type { LibassBurninExecutionReport, LibassBurninReport } from './libass-burnin-validation-types'

export const LIBASS_BURNIN_LOCAL_REPORT_PATH = 'activation-logs/libass-burnin-validation/phase45a/job-execution/phase45a-report.json'

export function buildLibassBurninReport(input: {
  executionReport?: LibassBurninExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): LibassBurninReport {
  const approvedEvidence = getApprovedLibassBurninEvidence()
  const executionReport = input.executionReport ?? readLibassBurninExecutionReport(input.reportPath ?? LIBASS_BURNIN_LOCAL_REPORT_PATH)
  const qaSummary = buildLibassBurninQaSummary(executionReport)
  const evidenceOnlyVerified = !executionReport && approvedEvidence.status === 'verified'
  const blockers = evidenceOnlyVerified
    ? approvedEvidence.blockers
    : Array.from(new Set([...(executionReport ? qaSummary.blockers : approvedEvidence.blockers), ...qaSummary.blockers]))
  const warnings = evidenceOnlyVerified
    ? approvedEvidence.warnings
    : Array.from(new Set([...approvedEvidence.warnings, ...qaSummary.warnings]))
  const ready = blockers.length === 0 && (Boolean(executionReport) || approvedEvidence.status === 'verified')

  return {
    reportId: 'activation-phase-45a-libass-burnin-validation',
    createdAt: new Date().toISOString(),
    config: libassBurninValidationConfig,
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport || approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    libassBurninValidated: ready || approvedEvidence.status === 'verified',
    phase45BReadiness: {
      readyForRemotionRenderValidation: ready || approvedEvidence.phase45BReadiness.readyForRemotionRenderValidation,
      reason: executionReport && ready ? 'Phase 45A passed; Phase 45B may start Remotion render validation only.' : approvedEvidence.phase45BReadiness.reason,
    },
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadRealUserMediaAllowed: false,
    finalDeliveryAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    trackBAllowed: false,
  }
}

export function summarizeLibassBurninReport(report: LibassBurninReport): string {
  return [
    `Libass burn-in validation report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Track: ${report.config.track}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Source video: ${report.config.approvedInputVideoGcsUri}`,
    `Caption source: ${report.config.approvedCaptionAssGcsUri}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Execution report: ${report.executionReport ? 'present' : report.approvedEvidence.qaReportUri ? `private GCS report recorded at ${report.approvedEvidence.qaReportUri}` : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Blockers: ${report.blockers.length}`,
    `Libass burn-in validated: ${report.libassBurninValidated}`,
    `Phase45B ready: ${report.phase45BReadiness.readyForRemotionRenderValidation}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Track B allowed: ${report.trackBAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Tool results:',
    `- ffmpeg: ${report.approvedEvidence.toolResults.ffmpeg}`,
    `- ffprobe: ${report.approvedEvidence.toolResults.ffprobe}`,
    `- libass: ${report.approvedEvidence.toolResults.libass}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readLibassBurninExecutionReport(path: string): LibassBurninExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as LibassBurninExecutionReport
}

export function libassBurninEvidenceToTypeScript(evidence: import('./libass-burnin-validation-types').ApprovedLibassBurninEvidence): string {
  return `import type { ApprovedLibassBurninEvidence } from './libass-burnin-validation-types'\n\nexport const approvedLibassBurninEvidence: ApprovedLibassBurninEvidence = ${JSON.stringify(evidence, null, 2)}\n\nexport function getApprovedLibassBurninEvidence(): ApprovedLibassBurninEvidence {\n  return {\n    ...approvedLibassBurninEvidence,\n    toolResults: { ...approvedLibassBurninEvidence.toolResults },\n    phase45BReadiness: { ...approvedLibassBurninEvidence.phase45BReadiness },\n    blockers: [...approvedLibassBurninEvidence.blockers],\n    warnings: [...approvedLibassBurninEvidence.warnings],\n  }\n}\n`
}
