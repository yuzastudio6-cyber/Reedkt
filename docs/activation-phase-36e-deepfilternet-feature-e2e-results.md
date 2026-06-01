# Phase 36E DeepFilterNet Feature E2E Results

- phase: 36E
- status: completed
- runId: `phase36e-20260530T152327`
- cloudRunExecutionId: `reeditpro-staging-deepfilternet-runtime-job-hk6jm`
- runtimeImage:
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:26aea2fc373322996430e9c677c5661e814777b2fe44714d508f3cdf50dd1e93`
- runtimeImageDigest:
  `sha256:26aea2fc373322996430e9c677c5661e814777b2fe44714d508f3cdf50dd1e93`
- sourceInputVideo:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`
- local source `/Users/macuser/Downloads/IMG_6024.MOV`: not used
- referencePhase31Audio:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase31/phase31-20260528T13060/audio-normalized-export.mp4`
- Phase36D evidence: `phase36d-20260530T141724`
- tool: DeepFilterNet v0.5.6
- runtimeJob: `reeditpro-staging-deepfilternet-runtime-job`
- runtimeImageTag: `staging-deepfilternet-audio-feature-e2e-001`
- planSnapshot:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36e/phase36e-20260530T152327/plan/approved-plan-snapshot.json`
- cleanedAudio:
  `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36e/phase36e-20260530T152327/audio/deepfilternet-cleaned.wav`
- privateReviewPreview:
  `gs://reeditpro-staging-reeditpro-final-exports/activation-audio-ai/phase36e/phase36e-20260530T152327/review/deepfilternet-audio-feature-review.mp4`
- localFinderReviewCopy:
  `/Volumes/backup/codex-results/reeditpro/phase36e-deepfilternet-feature-e2e/phase36e-20260530T152327/deepfilternet-audio-feature-review.mp4`
- qaReport:
  `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36e/phase36e-20260530T152327/reports/phase36e-report.json`
- deepFilterNetFeatureE2ECompleted: true
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false
- arbitraryRealUserMediaAllowed: false
- rnnoiseAllowed: false
- demucsAllowed: false
- providerAllowed: false
- revideoAllowed: false
- filmAllowed: false
- slowMotionAllowed: false
- finalDeliveryAllowed: false

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
- local Finder review copy: created under `/Volumes/backup/codex-results`

## QA Summary

- `source_integrity`: passed
- `plan_snapshot_integrity`: passed
- `phase36d_evidence`: passed
- `model_artifacts`: passed
- `audio_extraction`: passed
- `deepfilternet_cleanup`: passed
- `audio_safety_metrics`: passed
- `review_preview`: passed
- `artifact_privacy`: passed
- `feature_readiness_evidence`: passed
- `blocked_features`: passed

QA status is `warning` only because one controlled video does not prove
production, external beta, arbitrary-media, or broad-media readiness, and
subjective listening review is recommended.

## Feature Readiness

Ready for internal DeepFilterNet feature testing only. Phase 37A OCR approval
workflow may start next. Production, external beta, paid production, broad real
media, arbitrary media, RNNoise, Demucs, providers, Revideo, FILM, slow motion,
and final delivery remain blocked.
