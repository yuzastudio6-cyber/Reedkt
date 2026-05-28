import { realVideoAudioCleanupConfig, phase31Prefix } from './real-video-audio-cleanup-policy'
import type { RealVideoAudioCleanupPlan } from './real-video-audio-cleanup-types'

export function buildRealVideoAudioCleanupPlan(input: { runId: string }): RealVideoAudioCleanupPlan {
  const config = realVideoAudioCleanupConfig
  const prefix = phase31Prefix(input.runId)
  return {
    planId: `phase31-audio-cleanup-${input.runId}`,
    sourcePhase30RunId: config.phase30RunId,
    inputGcsUri: config.inputGcsUri,
    operations: [
      'ffprobe_stream_inspection',
      'ffmpeg_loudnorm_measurement',
      'ffmpeg_loudnorm_normalization',
      'ffmpeg_mux_normalized_audio',
    ],
    targets: {
      integratedLufs: config.targetIntegratedLufs,
      truePeakDbtp: config.targetTruePeakDbtp,
      loudnessRange: config.targetLra,
    },
    output: {
      cleanedAudioGcsUri: `gs://${config.generatedAssetsBucket}/${prefix}/audio/normalized-audio.m4a`,
      normalizedExportGcsUri: `gs://${config.finalExportsBucket}/${prefix}/audio-normalized-export.mp4`,
    },
    safety: {
      approvedPhase30InputOnly: true,
      sourceOverwriteAllowed: false,
      publicDeliveryAllowed: false,
      providerExecutionAllowed: false,
      gpuAllowed: false,
      modelDownloadAllowed: false,
      deepFilterNetAllowed: false,
      rnnoiseAllowed: false,
      demucsAllowed: false,
    },
  }
}
