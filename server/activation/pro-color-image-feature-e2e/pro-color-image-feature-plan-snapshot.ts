import { proColorImageFeatureE2EConfig, proColorImageFeatureE2EDoesNotDo } from './pro-color-image-feature-e2e-policy'
import { buildProColorImageFeatureSamplePlan } from './pro-color-image-feature-sample-plan'
import type { ProColorImageFeatureE2EPlanSnapshot } from './pro-color-image-feature-e2e-types'

export function buildProColorImageFeaturePlanSnapshot(runId = 'phase40d-YYYYMMDDTHHMMSS'): ProColorImageFeatureE2EPlanSnapshot {
  const prefix = `activation-pro-color-image/phase40d/${runId}`
  return {
    planId: 'phase40d-pro-color-image-feature-e2e-plan-v1',
    phase: '40D',
    phase40DRunId: runId,
    feature: 'pro_color_image_feature_e2e',
    approvedPlanSnapshot: true,
    rawPromptExecution: false,
    approvedInputVideo: proColorImageFeatureE2EConfig.approvedInputVideoGcsUri,
    sourcePhase: 32,
    phase40CRunId: proColorImageFeatureE2EConfig.phase40CRunId,
    sourceValidation: {
      expectedDurationSeconds: proColorImageFeatureE2EConfig.expectedDurationSeconds,
      approvedSourceOnly: true,
      privateSourceOnly: true,
    },
    tools: ['ffprobe', 'ffmpeg', 'openimageio', 'opencolorio', 'kornia'],
    toolVersions: {
      openColorIOVersion: proColorImageFeatureE2EConfig.openColorIOVersion,
      openImageIOVersion: proColorImageFeatureE2EConfig.openImageIOVersion,
      torchVersion: proColorImageFeatureE2EConfig.torchVersion,
      korniaVersion: proColorImageFeatureE2EConfig.korniaVersion,
    },
    samplePlan: buildProColorImageFeatureSamplePlan(),
    processingPlan: [
      'ffprobe validates approved source duration and stream metadata',
      'ffmpeg extracts exactly three downscaled PNG frames',
      'OpenImageIO reads/writes feature sample frames and records metadata',
      'OpenColorIO validates a safe raw identity transform on feature sample pixels',
      'Kornia runs CPU tensor grayscale, blur, and deterministic metrics',
      'private contact sheet/review manifest are created without final delivery',
    ],
    outputPrefixes: {
      generatedAssets: `gs://${proColorImageFeatureE2EConfig.generatedAssetsBucket}/${prefix}/`,
      previews: `gs://${proColorImageFeatureE2EConfig.previewsBucket}/${prefix}/`,
      qa: `gs://${proColorImageFeatureE2EConfig.qaBucket}/${prefix}/`,
      workerTemp: `gs://${proColorImageFeatureE2EConfig.workerTempBucket}/${prefix}/`,
    },
    blockedFeatures: proColorImageFeatureE2EDoesNotDo,
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
