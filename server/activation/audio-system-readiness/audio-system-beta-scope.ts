import { audioSystemReadinessConfig, audioSystemReadinessPrefix } from './audio-system-readiness-policy'
import type { AudioSystemBetaScopeManifest } from './audio-system-readiness-types'

export function buildAudioSystemBetaScopeManifest(input: {
  runId: string
  phase36EArtifacts?: string[]
  ready: boolean
}): AudioSystemBetaScopeManifest {
  return {
    phase: '36F',
    runId: input.runId,
    createdAt: new Date().toISOString(),
    includedFeatures: [
      'ffmpeg_loudness_normalization',
      'deepfilternet_noise_reduction',
    ],
    excludedFeatures: [
      'rnnoise',
      'demucs',
      'provider_audio',
      'provider_music',
      'provider_sfx',
      'revideo',
      'film',
      'slow_motion',
      'arbitrary_media',
      'production_delivery',
    ],
    allowedInputs: [
      `Current evidence is limited to ${audioSystemReadinessConfig.approvedInputVideo}.`,
      'Future internal beta test media requires a later explicit policy gate before use.',
    ],
    requiredRuntime: [
      'FFmpeg/FFprobe',
      'DeepFilterNet v0.5.6 private GCS artifacts',
      'Cloud Run CPU worker for DeepFilterNet feature runs',
      'Private GCS artifact storage',
    ],
    privateReviewArtifacts: input.phase36EArtifacts ?? [
      audioSystemReadinessConfig.phase36EReportUri,
    ],
    gates: [
      'source validation',
      'approved plan snapshot',
      'artifact privacy',
      'no provider calls',
      'no public output',
      'no external beta or production unlock',
      'subjective listening review recommended',
    ],
    readiness: {
      readyForInternalAudioFeatureTesting: input.ready,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadRealUserMediaAllowed: false,
      productionReadyAllowed: false,
    },
  }
}

export function audioSystemBetaScopeManifestUri(runId: string): string {
  return `gs://${audioSystemReadinessConfig.qaBucket}/${audioSystemReadinessPrefix(runId)}/beta-scope/audio-system-beta-scope.json`
}
