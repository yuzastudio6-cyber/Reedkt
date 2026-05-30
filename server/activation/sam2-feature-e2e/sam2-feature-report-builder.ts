import { existsSync, readFileSync } from 'node:fs'
import { getApprovedSam2FeatureE2EEvidence } from './approved-sam2-feature-e2e-evidence'
import { buildSam2FeatureE2ECommandPlans } from './sam2-feature-command-plan'
import { sam2FeatureE2EConfig } from './sam2-feature-e2e-policy'
import { buildSam2FeatureE2EIamPlan } from './sam2-feature-iam-plan'
import { buildSam2FeatureE2EQaSummary } from './sam2-feature-qa-summary'
import type {
  Sam2FeatureE2EExecutionReport,
  Sam2FeatureE2EReport,
} from './sam2-feature-e2e-types'

export const SAM2_FEATURE_E2E_LOCAL_REPORT_PATH = 'activation-logs/sam2-feature-e2e/phase35f/phase35f-report.json'

export function buildSam2FeatureE2EReport(input: {
  executionReport?: Sam2FeatureE2EExecutionReport
  reportPath?: string
  runId?: string
} = {}): Sam2FeatureE2EReport {
  const approvedEvidence = getApprovedSam2FeatureE2EEvidence()
  const executionReport = input.executionReport ?? readSam2FeatureE2EExecutionReport(input.reportPath ?? SAM2_FEATURE_E2E_LOCAL_REPORT_PATH)
  const qaSummary = buildSam2FeatureE2EQaSummary(executionReport)
  const evidenceBlockers = executionReport || approvedEvidence.status !== 'not_started' ? [] : approvedEvidence.blockers
  const blockers = Array.from(new Set([
    ...qaSummary.blockers,
    ...evidenceBlockers,
  ]))
  const warnings = Array.from(new Set([
    ...qaSummary.warnings,
    ...approvedEvidence.warnings,
  ]))
  const readiness = executionReport?.featureReadiness ?? approvedEvidence.featureReadiness
  const status = blockers.length > 0 ? executionReport ? 'failed' : 'planned' : 'ready'

  return {
    reportId: 'activation-phase-35f-sam2-feature-e2e-beta-readiness',
    createdAt: new Date().toISOString(),
    config: sam2FeatureE2EConfig,
    approvedEvidence,
    commandPlans: buildSam2FeatureE2ECommandPlans(input.runId ?? executionReport?.runId ?? approvedEvidence.runId ?? 'phase35f-YYYYMMDDTHHMMSS'),
    iamPlan: buildSam2FeatureE2EIamPlan(),
    executionReport,
    status,
    featureReadiness: readiness,
    blockers,
    warnings,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
  }
}

export function summarizeSam2FeatureE2EReport(report: Sam2FeatureE2EReport): string {
  return [
    `SAM2 feature E2E report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Feature readiness: ${report.featureReadiness.status}`,
    `Reason: ${report.featureReadiness.reason}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not recorded'}`,
    `Source: ${report.executionReport?.source.inputVideoGcsUri ?? report.approvedEvidence.source ?? report.config.approvedPreviewSource}`,
    `Preview scope: ${report.executionReport
      ? `${report.executionReport.previewScope.mode}, ${report.executionReport.previewScope.frameCount} frames at ${report.executionReport.previewScope.width}x${report.executionReport.previewScope.height}, ${report.executionReport.previewScope.fps} fps`
      : report.approvedEvidence.previewScope
        ? `${report.approvedEvidence.previewScope.mode}, ${report.approvedEvidence.previewScope.frameCount} frames at ${report.approvedEvidence.previewScope.width}x${report.approvedEvidence.previewScope.height}, ${report.approvedEvidence.previewScope.fps} fps`
        : 'planned full controlled private preview, fallback segment if required'}`,
    `Text: ${report.config.approvedText}`,
    `Model: ${report.config.modelId}`,
    `Plan snapshot: ${report.executionReport?.planSnapshot.gcsUri ?? report.approvedEvidence.planSnapshotUri ?? 'not recorded'}`,
    `Preview frames: ${report.executionReport?.composition.previewFrameUris.length ?? report.approvedEvidence.previewFrameCount ?? 0}`,
    `Preview clip generated: ${report.executionReport?.composition.previewClipGenerated ?? report.approvedEvidence.previewClipGenerated ?? false}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Paid production allowed: ${report.paidProductionAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    `Providers allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `FILM allowed: ${report.filmAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readSam2FeatureE2EExecutionReport(path: string): Sam2FeatureE2EExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as Sam2FeatureE2EExecutionReport
}
