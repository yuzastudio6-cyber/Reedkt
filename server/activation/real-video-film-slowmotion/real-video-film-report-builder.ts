import { existsSync, readFileSync } from 'node:fs'
import { getApprovedRealVideoFilmSlowmotionEvidence } from './approved-real-video-film-slowmotion-evidence'
import { buildRealVideoFilmCommandPlans } from './real-video-film-command-plan'
import { buildRealVideoFilmIamPlan } from './real-video-film-iam-plan'
import { buildRealVideoFilmPlanSnapshot } from './real-video-film-plan-snapshot'
import { buildRealVideoFilmQaSummary } from './real-video-film-qa-summary'
import { buildRealVideoFilmSegmentPlan } from './real-video-film-segment-plan'
import { buildRealVideoFilmSourceResolverSummary } from './real-video-film-source-resolver'
import { realVideoFilmSlowmotionConfig } from './real-video-film-slowmotion-policy'
import type {
  RealVideoFilmSlowmotionExecutionReport,
  RealVideoFilmSlowmotionReport,
} from './real-video-film-slowmotion-types'

export const REAL_VIDEO_FILM_LOCAL_REPORT_PATH = 'activation-logs/real-video-film-slowmotion/phase38d/job-execution/phase38d-report.json'

export function buildRealVideoFilmSlowmotionReport(input: {
  executionReport?: RealVideoFilmSlowmotionExecutionReport
  reportPath?: string
  imageDigest?: string
  runId?: string
} = {}): RealVideoFilmSlowmotionReport {
  const approvedEvidence = getApprovedRealVideoFilmSlowmotionEvidence()
  const executionReport = input.executionReport ?? readRealVideoFilmSlowmotionExecutionReport(input.reportPath ?? REAL_VIDEO_FILM_LOCAL_REPORT_PATH)
  const source = buildRealVideoFilmSourceResolverSummary()
  const segmentPlan = buildRealVideoFilmSegmentPlan()
  const qaSummary = buildRealVideoFilmQaSummary(executionReport, { approvedEvidenceVerified: approvedEvidence.status === 'verified' })
  const evidenceBlockers = executionReport || approvedEvidence.status === 'verified' ? [] : approvedEvidence.blockers
  const blockers = Array.from(new Set([...source.blockers, ...segmentPlan.blockers, ...qaSummary.blockers, ...evidenceBlockers]))
  const warnings = Array.from(new Set([...source.warnings, ...segmentPlan.warnings, ...qaSummary.warnings, ...approvedEvidence.warnings]))
  const verified = Boolean(executionReport && blockers.length === 0 && executionReport.qa.status !== 'blocked') || approvedEvidence.status === 'verified'

  return {
    reportId: 'activation-phase-38d-real-video-film-slowmotion',
    createdAt: new Date().toISOString(),
    config: realVideoFilmSlowmotionConfig,
    source,
    segmentPlan,
    planSnapshot: buildRealVideoFilmPlanSnapshot(input.runId ?? approvedEvidence.runId ?? 'phase38d-YYYYMMDDTHHMMSS'),
    iamPlan: buildRealVideoFilmIamPlan(),
    commandPlans: buildRealVideoFilmCommandPlans({ imageDigest: input.imageDigest ?? approvedEvidence.runtimeImageDigest, runId: input.runId ?? approvedEvidence.runId }),
    approvedEvidence,
    executionReport,
    status: verified ? 'ready' : executionReport ? 'failed' : approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings,
    runtimeImageBuilt: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    runtimeImagePushed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobDeployed: Boolean(executionReport || approvedEvidence.runtimeImageDigest),
    jobExecuted: Boolean(executionReport || approvedEvidence.cloudRunExecutionId),
    realVideoSlowmotionSampleCompleted: verified,
    phase38EReadiness: {
      readyForFilmPrivateFeatureE2EReadinessGate: verified || approvedEvidence.phase38EReadiness.readyForFilmPrivateFeatureE2EReadinessGate,
      reason: verified ? qaSummary.reason : approvedEvidence.phase38EReadiness.reason,
    },
    realVideoShortSegmentAllowed: true,
    fullVideoInterpolationAllowed: false,
    finalDeliveryAllowed: false,
    audioStretchAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    trackBToolsAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
  }
}

export function summarizeRealVideoFilmSlowmotionReport(report: RealVideoFilmSlowmotionReport): string {
  return [
    `Real-video FILM slow-motion report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Input video: ${report.config.approvedInputVideoGcsUri}`,
    `Segment: ${report.segmentPlan.startSeconds}s-${report.segmentPlan.endSeconds}s (${report.segmentPlan.sourceFrameCount} source frames, ${report.segmentPlan.frameWidth}x${report.segmentPlan.frameHeight})`,
    `Expected output frames: ${report.segmentPlan.outputFrameCount}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image tag: ${report.config.runtimeImageTag}`,
    `Model aggregate checksum: ${report.config.aggregateSha256}`,
    `Execution report: ${report.executionReport ? 'present' : 'missing'}`,
    `Approved evidence: ${report.approvedEvidence.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? report.executionReport?.runId ?? 'not recorded'}`,
    `Phase 38E ready: ${report.phase38EReadiness.readyForFilmPrivateFeatureE2EReadinessGate}`,
    `Full-video interpolation allowed: ${report.fullVideoInterpolationAllowed}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    `Audio stretch allowed: ${report.audioStretchAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real media allowed: ${report.broadRealUserMediaAllowed}`,
    '',
    'Output:',
    report.executionReport
      ? `- ${report.executionReport.interpolation.status}; interpolated=${report.executionReport.interpolation.interpolatedFrameUris.length}; preview=${report.executionReport.preview.previewMp4Status}`
      : report.approvedEvidence.status === 'verified' && report.approvedEvidence.selectedSegment
        ? `- verified by approved evidence; output frames=${report.approvedEvidence.selectedSegment.outputFrameCount}`
        : '- not run',
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}

export function readRealVideoFilmSlowmotionExecutionReport(path: string): RealVideoFilmSlowmotionExecutionReport | undefined {
  if (!existsSync(path)) return undefined
  return JSON.parse(readFileSync(path, 'utf8')) as RealVideoFilmSlowmotionExecutionReport
}

export function isRealVideoFilmSlowmotionExecutionVerified(report: RealVideoFilmSlowmotionExecutionReport | undefined): boolean {
  return Boolean(
    report?.ok
      && report.projectId === realVideoFilmSlowmotionConfig.projectId
      && report.source.inputVideoGcsUri === realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri
      && report.segment.durationSeconds <= realVideoFilmSlowmotionConfig.segmentDurationSeconds
      && report.segment.sourceFrameCount <= realVideoFilmSlowmotionConfig.maxSourceFrames
      && report.interpolation.outputFrameCount <= realVideoFilmSlowmotionConfig.maxOutputFrames
      && report.model.aggregateSha256 === realVideoFilmSlowmotionConfig.aggregateSha256
      && report.qa.status !== 'blocked'
      && report.safety.providerExecuted === false
      && report.safety.modelDownloadedExternally === false
      && report.safety.fullVideoInterpolationExecuted === false
      && report.safety.audioStretchExecuted === false
      && report.safety.finalDeliveryCreated === false
      && report.safety.revideoUsed === false
      && report.safety.publicAccessEnabled === false,
  )
}
