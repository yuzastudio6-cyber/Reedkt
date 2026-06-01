# Phase 36D Real-Video DeepFilterNet Audio Cleanup Results

- phase: 36D
- status: completed
- runId: `phase36d-20260530T141724`
- cloudRunExecutionId: `reeditpro-staging-deepfilternet-runtime-job-gqbkz`
- runtimeImage:
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:053a35cdbe3cac2d73be83fa19696b65b5d492b526d57e00c87d4e48506b09c4`
- runtimeImageDigest:
  `sha256:053a35cdbe3cac2d73be83fa19696b65b5d492b526d57e00c87d4e48506b09c4`
- sourceInputVideo:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- referencePhase31Audio:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4`
- tool: DeepFilterNet v0.5.6
- runtimeJob: `reeditpro-staging-deepfilternet-runtime-job`
- runtimeImageTag: `staging-deepfilternet-real-video-audio-001`
- planSnapshot:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36d/phase36d-20260530T141724/plan/approved-plan-snapshot.json`
- cleanedAudio:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36d/phase36d-20260530T141724/audio/deepfilternet-cleaned.wav`
- privateReviewPreview:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-audio-ai/phase36d/phase36d-20260530T141724/review/deepfilternet-audio-cleaned-preview.mp4`
- qaReport:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36d/phase36d-20260530T141724/reports/phase36d-report.json`
- realMediaAudioAiCleanupCompleted: true
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false
- rnnoiseAllowed: false
- demucsAllowed: false
- providerAllowed: false
- revideoAllowed: false
- filmAllowed: false
- slowMotionAllowed: false
- finalDeliveryAllowed: false

## Current Evidence

Phase 36C completed generated-audio DeepFilterNet runtime verification with run
`phase36c-20260530T133009` and execution
`reeditpro-staging-deepfilternet-runtime-job-pxjbq`.

Phase 36D executed one controlled real-video DeepFilterNet audio cleanup sample
using only the approved Phase 32 private export. The worker copied approved
DeepFilterNet v0.5.6 artifacts from private GCS, verified checksums, extracted
audio with FFmpeg, ran the approved `deep-filter` CLI with
`DeepFilterNet3_onnx.tar.gz`, wrote a private cleaned WAV, recorded audio
metrics, and remuxed a private review MP4 without creating a final delivery
export.

## Runtime Details

- source duration: 15.467s
- extracted audio: 48 kHz mono WAV, 15.466667s
- input RMS: -18.989 dBFS
- output RMS: -23.643 dBFS
- input peak: -1.570 dBFS
- output peak: -5.005 dBFS
- duration delta: 0s
- output clipping samples: 0
- private review MP4: created
- IAM changes: added narrow conditional prefix-scoped read/create bindings for
  the CPU worker service account.

## QA Summary

- `source_integrity`: passed
- `plan_snapshot_integrity`: passed
- `model_artifacts`: passed
- `audio_extraction`: passed
- `deepfilternet_cleanup`: passed
- `audio_safety_metrics`: passed
- `review_preview`: passed
- `artifact_privacy`: passed
- `blocked_features`: passed

QA status is `warning` only because one controlled sample does not prove
production, external beta, or arbitrary-media readiness, and subjective listening
review is recommended.

## Phase36E Readiness

Ready for DeepFilterNet private audio feature E2E planning only. Phase 36E must
remain private and controlled. Production, external beta, paid production, broad
real media, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow
motion, and final delivery remain blocked.
