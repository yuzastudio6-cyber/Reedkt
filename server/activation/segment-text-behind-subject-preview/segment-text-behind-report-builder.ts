import { existsSync, readFileSync } from 'node:fs'
import { getApprovedSegmentTextBehindSubjectPreviewEvidence } from './approved-segment-text-behind-subject-preview-evidence'
import { buildSegmentTextBehindSubjectPreviewCommandPlans } from './segment-text-behind-command-plan'
import { buildSegmentTextBehindSubjectPreviewCompositionPlan } from './segment-text-behind-composition-plan'
import { buildSegmentTextBehindSubjectPreviewIamPlan } from './segment-text-behind-iam-plan'
import { buildSegmentTextBehindSubjectPreviewQaSummary } from './segment-text-behind-qa-summary'
import { buildSegmentTextBehindSubjectPreviewSourceSummary } from './segment-text-behind-source-resolver'
import { segmentTextBehindSubjectPreviewConfig } from './segment-text-behind-subject-preview-policy'
import type {
  SegmentTextBehindSubjectPreviewExecutionReport,
  SegmentTextBehindSubjectPreviewReport,
} from './segment-text-behind-subject-preview-types'

export const SEGMENT_TEXT_BEHIND_LOCAL_REPORT_PATH = 'activation-logs/segment-text-behind-subject-preview/phase35e/phase35e-report.json'

export function buildSegmentTextBehindSubjectPreviewReport(input: {
  executionReport?: SegmentTextBehindSubjectPreviewExecutionReport
  reportPath?: string
  runId?: string
} = {}): SegmentTextBehindSubjectPreviewReport {
  const approvedEvidence = getApprovedSegmentTextBehindSubjectPreviewEvidence()
  const executionReport = input.executionReport ?? readSegmentTextBehindSubjectPreviewExecutionReport(input.reportPath ?? SEGMENT_TEXT_BEHIND_LOCAL_REPORT_PATH)
  const source = buildSegmentTextBehindSubjectPreviewSourceSummary({
    frameUris: executionReport?.segment.frameUris,
    maskUris: executionReport?.segment.maskUris,
  })
  const compositionPlan = buildSegmentTextBehindSubjectPreviewCompositionPlan()
  const qaSummary = buildSegmentTextBehindSubjectPreviewQaSummary(executionReport)
  const evidenceBlockers = executionReport || approvedEvidence.status === 'verified' ? [] : approvedEvidence.blockers
  const blockers = Array.from(new Set([
    ...source.blockers,
    ...qaSummary.blockers,
    ...evidenceBlockers,
  ]))
  const warnings = Array.from(new Set([
    ...source.warnings,
    ...compositionPlan.warnings,
    ...qaSummary.warnings,
    ...approvedEvidence.warnings,
  ]))
  const ready = Boolean(executionReport && blockers.length === 0 && qaSummary.status === 'ready') || approvedEvidence.status === 'verified'

  return {
    reportId: 'activation-phase-35e-segment-text-behind-subject-preview',
    createdAt: new Date().toISOString(),
    config: segmentTextBehindSubjectPreviewConfig,
    source,
    compositionPlan,
    iamPlan: buildSegmentTextBehindSubjectPreviewIamPlan(),
    commandPlans: buildSegmentTextBehindSubjectPreviewCommandPlans(input.runId ?? approvedEvidence.runId ?? 'phase35e-YYYYMMDDTHHMMSS'),
    approvedEvidence,
    executionReport,
    status: ready ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    segmentTextBehindSubjectPreviewCompleted: ready,
    phase36AReadiness: {
      readyForAudioAiApprovalWorkflow: ready || approvedEvidence.phase36AReadiness.readyForAudioAiApprovalWorkflow,
      reason: ready
        ? 'Phase 35E controlled private segment preview has no blocking QA findings; Phase 36A may proceed as audio AI approval workflow only.'
        : approvedEvidence.phase36AReadiness.reason,
    },
    segmentTextBehindSubjectAllowed: true,
    fullVideoTextBehindSubjectAllowed: false,
    fullVideoMaskAllowed: false,
    finalExportAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeSegmentTextBehindSubjectPreviewReport(report: SegmentTextBehindSubjectPreviewReport): string {
  return [
    `Segment text-behind-subject preview report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Source Phase 35D run: ${report.config.approvedPhase35DRunId}`,
    `Segment: ${report.config.approvedSegmentStartSeconds}s-${report.config.approvedSegmentEndSeconds}s (${report.config.approvedFrameCount} frames, ${report.config.approvedFrameWidth}x${report.config.approvedFrameHeight})`,
    `Text: ${report.config.approvedText}`,
    `Composition: ${report.compositionPlan.renderer}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Preview frames: ${report.executionReport?.composition.previewFrameUris.length ?? report.approvedEvidence.previewFrameCount ?? 0}`,
    `Preview clip generated: ${report.executionReport?.composition.previewClipGenerated ?? report.approvedEvidence.previewClipGenerated ?? false}`,
    `Phase 36A ready: ${report.phase36AReadiness.readyForAudioAiApprovalWorkflow}`,
    `Full-video text-behind-subject allowed: ${report.fullVideoTextBehindSubjectAllowed}`,
    `Full-video mask allowed: ${report.fullVideoMaskAllowed}`,
    `Final export allowed: ${report.finalExportAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readSegmentTextBehindSubjectPreviewExecutionReport(path: string): SegmentTextBehindSubjectPreviewExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as SegmentTextBehindSubjectPreviewExecutionReport
}
