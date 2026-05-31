import { realVideoProColorImageConfig, realVideoProColorImageDoesNotDo } from './real-video-pro-color-image-policy'
import { buildRealVideoProColorSamplePlan } from './real-video-pro-color-sample-plan'
import type { RealVideoProColorImagePlanSnapshot } from './real-video-pro-color-image-types'

export function buildRealVideoProColorPlanSnapshot(runId = 'phase40c-YYYYMMDDTHHMMSS'): RealVideoProColorImagePlanSnapshot {
  const prefix = `activation-pro-color-image/phase40c/${runId}`
  return {
    planId: 'phase40c-real-video-pro-color-image-sample-plan-v1',
    phase: '40C',
    feature: 'real_video_pro_color_image_sample',
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    approvedInputVideo: realVideoProColorImageConfig.approvedInputVideoGcsUri,
    sourcePhase: 32,
    phase40BRunId: realVideoProColorImageConfig.phase40BRunId,
    tools: ['ffprobe', 'ffmpeg', 'openimageio', 'opencolorio', 'kornia'],
    samplePlan: buildRealVideoProColorSamplePlan(),
    processingPlan: [
      'ffprobe validates approved source duration and stream metadata',
      'ffmpeg extracts exactly three downscaled PNG frames',
      'OpenImageIO reads/writes real-video-derived frames and records metadata',
      'OpenColorIO validates a safe raw identity transform on real-video-derived pixels',
      'Kornia runs CPU tensor grayscale, blur, and deterministic metrics',
    ],
    outputPrefixes: {
      generatedAssets: `gs://${realVideoProColorImageConfig.generatedAssetsBucket}/${prefix}/`,
      previews: `gs://${realVideoProColorImageConfig.previewsBucket}/${prefix}/`,
      qa: `gs://${realVideoProColorImageConfig.qaBucket}/${prefix}/`,
      workerTemp: `gs://${realVideoProColorImageConfig.workerTempBucket}/${prefix}/`,
    },
    blockedFeatures: realVideoProColorImageDoesNotDo,
    safety: {
      providerAllowed: false,
      revideoAllowed: false,
      publicAccessAllowed: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadRealUserMediaAllowed: false,
      fullVideoProcessingAllowed: false,
      finalDeliveryAllowed: false,
    },
  }
}

