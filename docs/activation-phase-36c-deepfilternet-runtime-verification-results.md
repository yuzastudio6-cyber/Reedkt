# Phase 36C DeepFilterNet Runtime Verification Results

- phase: 36C
- status: blocked
- runId: `phase36c-20260530T114158`
- tool: DeepFilterNet
- selectedVersion: v0.5.6
- runtimeMode: generated_audio
- generatedAudioOnly: true
- runtimeImage: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:a798e659eec6c001d0cc4b735632359f5fa61e299715cf19d1421c9aba96bde2`
- runtimeImageTag: `staging-deepfilternet-runtime-001`
- runtimeImageDigest: `sha256:a798e659eec6c001d0cc4b735632359f5fa61e299715cf19d1421c9aba96bde2`
- cloudRunJob: `reeditpro-staging-deepfilternet-runtime-job`
- cloudRunExecutionId: `reeditpro-staging-deepfilternet-runtime-job-9rcfc`
- serviceAccount: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- artifactGcsPath: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- deepFilterNetRuntimeVerified: false
- realVideoInputAllowed: false
- realMediaAudioAiAllowed: false
- rnnoiseAllowed: false
- demucsAllowed: false
- productionReadyAllowed: false
- externalBetaAllowed: false
- paidProductionAllowed: false
- broadRealUserMediaAllowed: false
- providerAllowed: false
- revideoAllowed: false
- filmAllowed: false
- slowMotionAllowed: false

## Checksums

- CLI SHA-256:
  `70775e251eee44c0f2451a1e833326cf8bcbbe304d3e7cd12851e6fce72ef7da`
- DeepFilterNet3 ONNX archive SHA-256:
  `c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616`
- Aggregate SHA-256:
  `eab42c424fc818938f1b8591f4110318f86284b520e5244e571c2f3f56f5126b`

## Current Evidence

Phase 36B private artifact upload/checksum evidence is complete. Phase 36C
built and pushed the dedicated CPU-only runtime image, deployed the Cloud Run
Job, and executed it in generated-audio mode. The execution stopped before
copying the DeepFilterNet CLI because the CPU worker service account could not
read the approved Phase 36B artifact objects.

## Execution Attempts

- `reeditpro-staging-deepfilternet-runtime-job-n97tq`: blocked before artifact
  copy while IAM propagation was still settling.
- `reeditpro-staging-deepfilternet-runtime-job-wn6kp`: blocked when retrying the
  same run ID would have overwritten the prior blocked report path.
- `reeditpro-staging-deepfilternet-runtime-job-x5p6w`: blocked on the CPU worker
  service account missing `storage.objects.get` for the approved artifact prefix.
- `reeditpro-staging-deepfilternet-runtime-job-9rcfc`: blocked on the same
  `storage.objects.get` access after adding an additional explicit object
  resource-context prefix binding.

## IAM

Added only prefix-scoped conditional bindings for
`reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`:

- `roles/storage.objectViewer` on
  `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- an additional object-context `roles/storage.objectViewer` binding for the same
  artifact prefix
- `roles/storage.objectCreator` on Phase 36C generated, analysis, QA, and
  worker-temp prefixes

No `storage.admin`, `storage.objectAdmin`, owner/editor, public principal, or
broad write role was granted.

## QA Summary

- `model_artifacts`: blocked before artifact copy
- `runtime_integrity`: blocked before DeepFilterNet CLI execution
- `fixture_integrity`: not reached
- `enhanced_audio_artifacts`: not reached
- `audio_safety_metrics`: not reached
- `artifact_privacy`: no public access enabled
- `blocked_features`: real media, RNNoise, Demucs, providers, Revideo, FILM,
  slow motion, production, beta, and broad media remained blocked

## Phase36D Readiness

Blocked. Phase 36D must not proceed until a future Phase 36C retry can copy the
approved DeepFilterNet artifacts from private GCS and complete generated-audio
runtime QA.

## Blocker

`reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` does not have
`storage.objects.get` access to the approved Phase 36B DeepFilterNet artifact
objects, despite the Phase 36C prefix-scoped conditional objectViewer bindings
being present on the bucket IAM policy.

## Blocked Scope

Real video/audio input, arbitrary user media, RNNoise, Demucs, providers,
Revideo, FILM, slow motion, production, external beta, paid production, and
broad real media remain blocked.
