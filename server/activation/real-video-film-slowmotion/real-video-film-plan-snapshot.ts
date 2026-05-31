import { realVideoFilmSlowmotionArtifactPrefix, realVideoFilmSlowmotionConfig } from './real-video-film-slowmotion-policy'
import { buildRealVideoFilmSegmentPlan } from './real-video-film-segment-plan'
import type { RealVideoFilmSlowmotionPlanSnapshot } from './real-video-film-slowmotion-types'

export function buildRealVideoFilmPlanSnapshot(runId = 'phase38d-YYYYMMDDTHHMMSS'): RealVideoFilmSlowmotionPlanSnapshot {
  const artifactPrefix = /^phase38d-[0-9A-Za-z]+$/.test(runId)
    ? realVideoFilmSlowmotionArtifactPrefix(runId)
    : `${realVideoFilmSlowmotionConfig.reportObjectPrefix}/${runId}`
  return {
    phase: '38D',
    runId,
    rawPromptExecution: false,
    approvedSource: realVideoFilmSlowmotionConfig.approvedInputVideoGcsUri,
    segment: buildRealVideoFilmSegmentPlan(),
    interpolation: {
      pairwiseMidpointOnly: true,
      interpolationTime: realVideoFilmSlowmotionConfig.interpolationTime,
      expectedOutputFrameCount: realVideoFilmSlowmotionConfig.outputFrameCount,
      maxOutputFrames: realVideoFilmSlowmotionConfig.maxOutputFrames,
    },
    artifactPrefixes: {
      generatedAssets: `gs://${realVideoFilmSlowmotionConfig.generatedAssetsBucket}/${artifactPrefix}/`,
      previews: `gs://${realVideoFilmSlowmotionConfig.previewsBucket}/${artifactPrefix}/`,
      qa: `gs://${realVideoFilmSlowmotionConfig.qaBucket}/${artifactPrefix}/`,
      workerTemp: `gs://${realVideoFilmSlowmotionConfig.workerTempBucket}/${artifactPrefix}/`,
    },
    blockedFeatures: {
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
      publicAccessAllowed: false,
    },
    safetyGates: {
      sourceFrameCount: realVideoFilmSlowmotionConfig.sourceFrameCount,
      maxSourceFrames: realVideoFilmSlowmotionConfig.maxSourceFrames,
      outputFrameCount: realVideoFilmSlowmotionConfig.outputFrameCount,
      maxOutputFrames: realVideoFilmSlowmotionConfig.maxOutputFrames,
      modelAggregateSha256: realVideoFilmSlowmotionConfig.aggregateSha256,
      approvedPhase38CRunId: realVideoFilmSlowmotionConfig.approvedPhase38CRunId,
    },
  }
}
