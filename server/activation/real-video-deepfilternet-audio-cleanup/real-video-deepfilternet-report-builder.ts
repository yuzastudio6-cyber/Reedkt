import { getApprovedRealVideoDeepFilterNetEvidence } from './approved-real-video-deepfilternet-audio-cleanup-evidence'
import { buildRealVideoDeepFilterNetCommandPlans } from './real-video-deepfilternet-command-plan'
import { buildRealVideoDeepFilterNetIamPlan } from './real-video-deepfilternet-iam-plan'
import { buildRealVideoDeepFilterNetPlanSnapshot } from './real-video-deepfilternet-plan-snapshot'
import { realVideoDeepFilterNetConfig } from './real-video-deepfilternet-audio-cleanup-policy'
import { buildRealVideoDeepFilterNetSourceSummary } from './real-video-deepfilternet-source-resolver'
import type { RealVideoDeepFilterNetReport } from './real-video-deepfilternet-audio-cleanup-types'

export function buildRealVideoDeepFilterNetReport(): RealVideoDeepFilterNetReport {
  const approvedEvidence = getApprovedRealVideoDeepFilterNetEvidence()
  const sourceSummary = buildRealVideoDeepFilterNetSourceSummary()
  const blockers = Array.from(new Set([
    ...approvedEvidence.blockers,
    ...sourceSummary.blockers,
  ]))
  const completed = approvedEvidence.status === 'completed' && blockers.length === 0

  return {
    reportId: 'activation-phase-36d-real-video-deepfilternet-audio-cleanup',
    createdAt: new Date().toISOString(),
    config: realVideoDeepFilterNetConfig,
    sourceSummary,
    planSnapshot: buildRealVideoDeepFilterNetPlanSnapshot(approvedEvidence.runId ?? 'phase36d-YYYYMMDDTHHMMSS'),
    iamPlan: buildRealVideoDeepFilterNetIamPlan(),
    commandPlans: buildRealVideoDeepFilterNetCommandPlans({
      imageDigest: approvedEvidence.runtimeImageDigest,
      runId: approvedEvidence.runId,
    }),
    approvedEvidence,
    status: completed ? 'ready' : approvedEvidence.status === 'blocked' ? 'blocked' : 'planned',
    blockers,
    warnings: Array.from(new Set([
      ...approvedEvidence.warnings,
      ...sourceSummary.warnings,
      'Phase 36D does not approve arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion, final delivery, production, beta, or broad media.',
    ])),
    realMediaAudioAiCleanupCompleted: completed,
    phase36EReadiness: approvedEvidence.phase36EReadiness,
    audioCleanupAllowedForApprovedChain: true,
    arbitraryRealUserMediaAllowed: false,
    rnnoiseAllowed: false,
    demucsAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
    finalDeliveryAllowed: false,
  }
}

export function summarizeRealVideoDeepFilterNetReport(report: RealVideoDeepFilterNetReport): string {
  return [
    `Real-video DeepFilterNet audio cleanup report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? '(not run)'}`,
    `Source video: ${report.config.approvedInputVideo}`,
    `Reference Phase 31 audio: ${report.config.referencePhase31Audio}`,
    `Tool: ${report.config.toolId} ${report.config.toolVersion}`,
    `Job: ${report.config.runtimeJobName}`,
    `Image: ${report.approvedEvidence.runtimeImage ?? report.config.runtimeTargetImage}`,
    `CLI SHA-256: ${report.config.cliSha256}`,
    `Model archive SHA-256: ${report.config.modelArchiveSha256}`,
    `Aggregate SHA-256: ${report.config.aggregateSha256}`,
    `Plan snapshot: ${report.approvedEvidence.planSnapshotUri ?? 'not created'}`,
    `Cleaned audio: ${report.approvedEvidence.cleanedAudioUri ?? 'not created'}`,
    `Private review preview: ${report.approvedEvidence.privateReviewPreviewUri ?? 'not created'}`,
    `Real-media audio AI cleanup completed: ${report.realMediaAudioAiCleanupCompleted}`,
    `Phase 36E ready: ${report.phase36EReadiness.readyForDeepFilterNetPrivateAudioFeatureE2E}`,
    `Arbitrary real user media allowed: ${report.arbitraryRealUserMediaAllowed}`,
    `RNNoise allowed: ${report.rnnoiseAllowed}`,
    `Demucs allowed: ${report.demucsAllowed}`,
    `Provider allowed: ${report.providerAllowed}`,
    `Revideo allowed: ${report.revideoAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad real user media allowed: ${report.broadRealUserMediaAllowed}`,
    `FILM allowed: ${report.filmAllowed}`,
    `Slow motion allowed: ${report.slowMotionAllowed}`,
    `Final delivery allowed: ${report.finalDeliveryAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...(report.warnings.length ? report.warnings.map((warning) => `- ${warning}`) : ['- none']),
  ].join('\n')
}
