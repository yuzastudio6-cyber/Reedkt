import type { AudioAiFutureScope } from './audio-ai-approval-types'

export const audioAiFutureScope: AudioAiFutureScope = {
  phaseSequence: [
    {
      phase: '36B',
      name: 'First approved audio AI download/load',
      allowedOnlyAfter: [
        'Phase 36A identifies the first tool recommendation.',
        'Exact official artifact source is selected.',
        'Private staging storage path and checksum plan are approved.',
      ],
      scope: [
        'Download only the selected approved audio AI artifact into temp outside the repo.',
        'Compute checksums and model/tool manifest.',
        'Upload only to private staging GCS under gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/<tool>/<model>/.',
        'Commit no model files or downloaded binaries to git.',
      ],
      stillBlocked: ['runtime execution', 'audio/media processing', 'public access', 'production/beta/broad media'],
    },
    {
      phase: '36C',
      name: 'Generated-audio runtime verification',
      allowedOnlyAfter: [
        'Phase 36B records private artifact storage and checksums.',
        'Dedicated runtime image/job plan is approved.',
      ],
      scope: [
        'Use generated/synthetic audio only.',
        'Copy the selected artifact from private GCS.',
        'Verify checksums before runtime.',
        'Emit private QA for speech clarity, artifacts, loudness, and sync.',
      ],
      stillBlocked: ['real video', 'real user media', 'final export', 'production/beta/broad media'],
    },
    {
      phase: '36D',
      name: 'Controlled real-video audio AI cleanup sample',
      allowedOnlyAfter: [
        'Phase 36C generated-audio runtime QA passes.',
        'A bounded sample from the approved controlled real-video chain is selected.',
      ],
      scope: [
        'Use only the approved controlled real-video chain.',
        'Process one bounded private sample.',
        'Compare against the Phase 31 FFmpeg loudness baseline.',
        'Require human listening review before broader use.',
      ],
      stillBlocked: ['arbitrary user media', 'full feature E2E', 'public access', 'production/beta/broad media'],
    },
    {
      phase: '36E',
      name: 'Private audio AI feature E2E gate',
      allowedOnlyAfter: [
        'Phase 36D controlled real-video sample passes QA.',
        'An approved plan snapshot and private preview scope are recorded.',
      ],
      scope: [
        'Run a private bounded feature preview only.',
        'Keep artifacts private and review-only.',
        'Evaluate whether internal testing is appropriate.',
      ],
      stillBlocked: ['external beta', 'paid production', 'broad real media', 'public delivery', 'provider execution'],
    },
  ],
  audioAiPlanningRecommendation: 'deepfilternet_first',
  deepFilterNetPlanningAllowed: true,
  rnnoiseFallbackPlanningAllowed: true,
  demucsRestrictedPlanningAllowed: true,
  audioAiDownloadAllowed: false,
  audioAiRuntimeAllowed: false,
  realVideoAudioAiCleanupAllowed: false,
  providerAllowed: false,
  revideoAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
}
