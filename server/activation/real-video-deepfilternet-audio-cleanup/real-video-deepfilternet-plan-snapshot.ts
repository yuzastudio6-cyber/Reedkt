import { realVideoDeepFilterNetConfig, realVideoDeepFilterNetDoesNotDo, realVideoDeepFilterNetPrefix } from './real-video-deepfilternet-audio-cleanup-policy'
import type { RealVideoDeepFilterNetPlanSnapshot } from './real-video-deepfilternet-audio-cleanup-types'

export function buildRealVideoDeepFilterNetPlanSnapshot(runId = 'phase36d-YYYYMMDDTHHMMSS'): RealVideoDeepFilterNetPlanSnapshot {
  const prefix = runId === 'phase36d-YYYYMMDDTHHMMSS'
    ? `${realVideoDeepFilterNetConfig.reportObjectPrefix}/${runId}`
    : realVideoDeepFilterNetPrefix(runId)
  return {
    planId: `activation-phase36d-real-video-deepfilternet-audio-cleanup-${runId}`,
    phase36DRunId: runId,
    approvedInputVideo: realVideoDeepFilterNetConfig.approvedInputVideo,
    referencePhase31Audio: realVideoDeepFilterNetConfig.referencePhase31Audio,
    sourceValidation: {
      expectedDurationSeconds: realVideoDeepFilterNetConfig.expectedInputDurationSeconds,
      maxDurationSeconds: realVideoDeepFilterNetConfig.maxInputDurationSeconds,
      audioStreamRequired: true,
      videoStreamRequired: true,
    },
    feature: 'real_video_deepfilternet_audio_cleanup',
    tool: {
      id: 'deepfilternet',
      version: 'v0.5.6',
      artifactGcsPath: realVideoDeepFilterNetConfig.artifactGcsPath,
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
      generatedAssets: `gs://${realVideoDeepFilterNetConfig.generatedAssetsBucket}/${prefix}/`,
      finalExports: `gs://${realVideoDeepFilterNetConfig.finalExportsBucket}/${prefix}/`,
      analysis: `gs://${realVideoDeepFilterNetConfig.analysisBucket}/${prefix}/`,
      qa: `gs://${realVideoDeepFilterNetConfig.qaBucket}/${prefix}/`,
      workerTemp: `gs://${realVideoDeepFilterNetConfig.workerTempBucket}/${prefix}/`,
    },
    blockedFeatures: realVideoDeepFilterNetDoesNotDo,
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
