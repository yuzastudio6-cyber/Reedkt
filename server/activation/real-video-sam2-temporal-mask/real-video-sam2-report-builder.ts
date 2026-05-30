import { existsSync, readFileSync } from 'node:fs'
import { getApprovedRealVideoSam2TemporalMaskEvidence } from './approved-real-video-sam2-temporal-mask-evidence'
import { buildRealVideoSam2CommandPlans } from './real-video-sam2-command-plan'
import { buildRealVideoSam2IamPlan } from './real-video-sam2-iam-plan'
import { buildRealVideoSam2PromptPlan } from './real-video-sam2-prompt-plan'
import { buildRealVideoSam2QaSummary } from './real-video-sam2-qa-summary'
import { buildRealVideoSam2SegmentPlan } from './real-video-sam2-segment-plan'
import { buildRealVideoSam2SourceResolverSummary } from './real-video-sam2-source-resolver'
import { realVideoSam2TemporalMaskConfig } from './real-video-sam2-temporal-mask-policy'
import type {
  RealVideoSam2TemporalMaskExecutionReport,
  RealVideoSam2TemporalMaskReport,
} from './real-video-sam2-temporal-mask-types'

export const REAL_VIDEO_SAM2_LOCAL_REPORT_PATH = 'activation-logs/real-video-sam2-temporal-mask/phase35d/job-execution/phase35d-report.json'

export function buildRealVideoSam2TemporalMaskReport(input: {
  executionReport?: RealVideoSam2TemporalMaskExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): RealVideoSam2TemporalMaskReport {
  const approvedEvidence = getApprovedRealVideoSam2TemporalMaskEvidence()
  const executionReport = input.executionReport ?? readRealVideoSam2TemporalMaskExecutionReport(input.reportPath ?? REAL_VIDEO_SAM2_LOCAL_REPORT_PATH)
  const source = buildRealVideoSam2SourceResolverSummary()
  const segmentPlan = buildRealVideoSam2SegmentPlan()
  const promptPlan = buildRealVideoSam2PromptPlan()
  const qaSummary = buildRealVideoSam2QaSummary(executionReport, { approvedEvidenceVerified: approvedEvidence.status === 'verified' })
  const evidenceBlockers = executionReport || approvedEvidence.status === 'verified' ? [] : approvedEvidence.blockers
  const blockers = Array.from(new Set([
    ...source.blockers,
    ...segmentPlan.blockers,
    ...promptPlan.blockers,
    ...qaSummary.blockers,
    ...evidenceBlockers,
  ]))
  const warnings = Array.from(new Set([
    ...source.warnings,
    ...segmentPlan.warnings,
    ...promptPlan.warnings,
    ...qaSummary.warnings,
    ...approvedEvidence.warnings,
  ]))
  const verified = Boolean(executionReport && blockers.length === 0 && qaSummary.status === 'ready') || approvedEvidence.status === 'verified'

  return {
    reportId: 'activation-phase-35d-real-video-sam2-temporal-mask',
    createdAt: new Date().toISOString(),
    config: realVideoSam2TemporalMaskConfig,
    source,
    segmentPlan,
    promptPlan,
    iamPlan: buildRealVideoSam2IamPlan(),
    commandPlans: buildRealVideoSam2CommandPlans({ imageDigest: input.imageDigest ?? approvedEvidence.runtimeImageDigest, runId: input.runId ?? approvedEvidence.runId }),
    approvedEvidence,
    executionReport,
    status: verified ? 'ready' : executionReport ? 'failed' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(executionReport || approvedEvidence.status === 'verified'),
    jobExecuted: Boolean(executionReport || approvedEvidence.status === 'verified'),
    realVideoTemporalTrackingCompleted: verified,
    phase35EReadiness: {
      readyForControlledSegmentTextBehindSubjectPreview: verified || approvedEvidence.phase35EReadiness.readyForControlledSegmentTextBehindSubjectPreview,
      reason: verified ? qaSummary.reason : approvedEvidence.phase35EReadiness.reason,
    },
    realVideoShortSegmentAllowed: true,
    arbitraryRealUserMediaAllowed: false,
    fullVideoMaskAllowed: false,
    fullVideoTextBehindSubjectAllowed: false,
    textBehindSubjectVideoAllowed: false,
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

export function summarizeRealVideoSam2TemporalMaskReport(report: RealVideoSam2TemporalMaskReport): string {
  return [
    `Real-video SAM2 temporal mask report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Input video: ${report.config.approvedInputVideoGcsUri}`,
    `Segment: ${report.segmentPlan.startSeconds}s-${report.segmentPlan.endSeconds}s (${report.segmentPlan.frameCount} frames, ${report.segmentPlan.frameWidth}x${report.segmentPlan.frameHeight})`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Model: ${report.config.modelId}`,
    `Checkpoint checksum: ${report.config.checkpointSha256}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Phase 35E ready: ${report.phase35EReadiness.readyForControlledSegmentTextBehindSubjectPreview}`,
    `Full-video mask allowed: ${report.fullVideoMaskAllowed}`,
    `Text-behind-subject video allowed: ${report.fullVideoTextBehindSubjectAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Mask output:',
    report.executionReport
      ? `- ${report.executionReport.masks.status}; masks=${report.executionReport.masks.maskUris.length}; overlays=${report.executionReport.masks.overlayUris.length}`
      : report.approvedEvidence.status === 'verified' && report.approvedEvidence.selectedSegment
        ? `- verified by approved evidence; frames=${report.approvedEvidence.selectedSegment.frameCount}`
        : '- not run',
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readRealVideoSam2TemporalMaskExecutionReport(path: string): RealVideoSam2TemporalMaskExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoSam2TemporalMaskExecutionReport
}
