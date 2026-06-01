# Phase 36B Download Approved DeepFilterNet Artifacts Results

- phase: 36B
- status: completed
- tool: DeepFilterNet
- selectedVersion: v0.5.6
- licenseName: MIT OR Apache-2.0
- codexLicenseDecision: staging_download_approved_by_codex
- humanLicenseApprovalRequired: false
- targetGcsPath: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- deepFilterNetDownloadCompleted: true
- deepFilterNetRuntimeAllowed: false
- audioProcessingAllowed: false
- realVideoAudioAiCleanupAllowed: false
- rnnoiseDownloadAllowed: false
- demucsDownloadAllowed: false
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false
- providerAllowed: false
- revideoAllowed: false
- filmAllowed: false
- slowMotionAllowed: false

## Selected Artifacts

- `deep-filter-0.5.6-x86_64-unknown-linux-musl`
- `DeepFilterNet3_onnx.tar.gz`

## Checksums

- CLI SHA-256: `70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da`
- DeepFilterNet3 ONNX archive SHA-256: `c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616`
- Aggregate SHA-256: `eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b`

## Private GCS Artifacts

- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/deep-filter-0.5.6-x86_64-unknown-linux-musl`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/DeepFilterNet3_onnx.tar.gz`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/file_checksums_sha256.txt`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/model_tree_manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/source_evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/license_evidence.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/download_report.json`

## Upload Verification

- downloadedAt: `2026-05-30T10:22:31.772Z`
- uploadedAt: `2026-05-30T10:22:37.628Z`
- verifiedAt: `2026-05-30T10:22:45.941Z`
- uploadedObjectCount: 7
- IAM changes: none; Phase 36C generated-audio runtime service-account
  objectViewer access is deferred.

## Phase36C Readiness

Ready for generated-audio DeepFilterNet runtime verification only. Not ready
for real-video audio AI cleanup, arbitrary user media, production, external
beta, paid production, providers, or Revideo.

## Current Blockers

- none for Phase 36C generated-audio runtime planning
- runtime, media processing, real-video cleanup, RNNoise, Demucs, production,
  external beta, paid production, broad real media, providers, Revideo, FILM,
  and slow motion remain blocked by policy

## Blocked Scope

DeepFilterNet runtime, RNNoise, Demucs, audio processing, real-video audio AI
cleanup, Docker, Cloud Run, providers, Revideo, FILM, slow motion, production,
external beta, paid production, and broad real media remain blocked.
