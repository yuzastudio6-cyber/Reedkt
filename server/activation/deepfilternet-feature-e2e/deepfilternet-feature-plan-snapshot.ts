import { deepFilterNetFeatureE2EConfig, deepFilterNetFeatureE2EDoesNotDo, deepFilterNetFeatureE2EPrefix } from './deepfilternet-feature-e2e-policy'
import type { DeepFilterNetFeatureE2EPlanSnapshot } from './deepfilternet-feature-e2e-types'

export function buildDeepFilterNetFeatureE2EPlanSnapshot(runId = 'phase36e-YYYYMMDDTHHMMSS'): DeepFilterNetFeatureE2EPlanSnapshot {
  const prefix = runId === 'phase36e-YYYYMMDDTHHMMSS'
    ? `${deepFilterNetFeatureE2EConfig.reportObjectPrefix}/${runId}`
    : deepFilterNetFeatureE2EPrefix(runId)
  return {
    planId: `activation-phase36e-deepfilternet-feature-e2e-${runId}`,
    phase36ERunId: runId,
    phase36DRunId: deepFilterNetFeatureE2EConfig.phase36DRunId,
    approvedInputVideo: deepFilterNetFeatureE2EConfig.approvedInputVideo,
    referencePhase31Audio: deepFilterNetFeatureE2EConfig.referencePhase31Audio,
    sourceValidation: {
      expectedDurationSeconds: deepFilterNetFeatureE2EConfig.expectedInputDurationSeconds,
      maxDurationSeconds: deepFilterNetFeatureE2EConfig.maxInputDurationSeconds,
      audioStreamRequired: true,
      videoStreamRequired: true,
    },
    feature: 'deepfilternet_audio_feature_e2e',
    tool: {
      id: 'deepfilternet',
      version: 'v0.5.6',
      artifactGcsPath: deepFilterNetFeatureE2EConfig.artifactGcsPath,
    },
    phase36DEvidence: {
      qaReportUri: deepFilterNetFeatureE2EConfig.phase36DReportUri,
      previousRuntimeImageDigest: deepFilterNetFeatureE2EConfig.phase36DImageDigest,
    },
    audioExtractionPlan: {
      outputFormat: 'wav',
      sampleRate: 48000,
      channels: 1,
    },
    cleanupPlan: {
      cliCommand: 'deep-filter --model <local DeepFilterNet3_onnx.tar.gz> --output-dir <enhanced-dir> <input-audio.wav>',
      externalDownloadsAllowed: false,
    },
    remuxPlan: {
      privateReviewMp4Allowed: true,
      finalDeliveryAllowed: false,
      videoStreamPolicy: 'copy_original_stream_when_safe',
    },
    outputPrefixes: {
      generatedAssets: `gs://${deepFilterNetFeatureE2EConfig.generatedAssetsBucket}/${prefix}/`,
      finalExports: `gs://${deepFilterNetFeatureE2EConfig.finalExportsBucket}/${prefix}/`,
      analysis: `gs://${deepFilterNetFeatureE2EConfig.analysisBucket}/${prefix}/`,
      qa: `gs://${deepFilterNetFeatureE2EConfig.qaBucket}/${prefix}/`,
      workerTemp: `gs://${deepFilterNetFeatureE2EConfig.workerTempBucket}/${prefix}/`,
    },
    blockedFeatures: deepFilterNetFeatureE2EDoesNotDo,
    approval: {
      approvedPlanSnapshot: true,
      rawPromptExecution: false,
    },
    safety: {
      providerAllowed: false,
      rnnoiseAllowed: false,
      demucsAllowed: false,
      publicAccessAllowed: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadRealUserMediaAllowed: false,
      finalDeliveryAllowed: false,
    },
  }
}
