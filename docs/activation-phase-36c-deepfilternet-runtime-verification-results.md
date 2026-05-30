# Phase 36C DeepFilterNet Runtime Verification Results

- phase: 36C
- status: completed
- runId: `phase36c-20260530T133009`
- tool: DeepFilterNet
- selectedVersion: v0.5.6
- runtimeMode: generated_audio
- generatedAudioOnly: true
- runtimeImage: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime@sha256:363d436bbd958a38ddb18cfb028ce2d3eb379317c28cef81dda502567a0aafce`
- runtimeImageTag: `staging-deepfilternet-runtime-001`
- runtimeImageDigest: `sha256:363d436bbd958a38ddb18cfb028ce2d3eb379317c28cef81dda502567a0aafce`
- cloudRunJob: `reeditpro-staging-deepfilternet-runtime-job`
- cloudRunExecutionId: `reeditpro-staging-deepfilternet-runtime-job-pxjbq`
- serviceAccount: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- artifactGcsPath: `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- qaReportUri: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36c/phase36c-20260530T133009/reports/phase36c-report.json`
- deepFilterNetRuntimeVerified: true
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
Job, copied the approved private DeepFilterNet artifacts from staging GCS,
verified checksums, generated a deterministic synthetic audio fixture, ran the
approved `deep-filter` CLI with the approved DeepFilterNet3 ONNX archive, and
uploaded private generated-audio, enhanced-audio, metadata, metrics, QA, and
report artifacts.

The earlier `storage.objects.get` blocker was root-caused to a worker bug: after
creating private output objects with prefix-scoped `roles/storage.objectCreator`,
the worker tried to call GCS `getMetadata()` on those created objects. Phase 36C
keeps output permissions create-only and now records local file size/SHA-256
instead of requiring read-back access.

The DeepFilterNet CLI blocker was also fixed by using the actual v0.5.6 option
`--output-dir` instead of the invalid `--out-dir`.

## Execution Attempts

- `reeditpro-staging-deepfilternet-runtime-job-n97tq`: blocked before artifact
  copy while IAM propagation was still settling.
- `reeditpro-staging-deepfilternet-runtime-job-wn6kp`: blocked when retrying the
  same run ID would have overwritten the prior blocked report path.
- `reeditpro-staging-deepfilternet-runtime-job-x5p6w`: blocked on
  `storage.objects.get`.
- `reeditpro-staging-deepfilternet-runtime-job-9rcfc`: blocked on
  `storage.objects.get` after an additional object-context prefix binding.
- `reeditpro-staging-deepfilternet-runtime-job-sp2fc`: blocked on
  `storage.objects.get` with fresh run ID `phase36c-20260530T123258`.
- `reeditpro-staging-deepfilternet-runtime-job-d7pq2`: blocked on
  `storage.objects.get` after managed-folder objectViewer was added.
- `reeditpro-staging-deepfilternet-runtime-job-b6mmw`: blocked on
  `storage.objects.get` with diagnostic image
  `sha256:2c709d298628a5189ec0f4ddc0f11ac78554af328a81f647414837c9388402bc`.
- `reeditpro-staging-deepfilternet-runtime-job-g4vwv`: blocked on
  `storage.objects.get` after bucket-level exact-object viewer.
- `reeditpro-staging-deepfilternet-runtime-job-fdpgb`: blocked on
  `storage.objects.get` after project-level exact-object viewer.
- `reeditpro-staging-deepfilternet-runtime-job-7jm4n`: still blocked on
  `storage.objects.get`; later diagnosed as GCS output metadata read after
  create-only output upload.
- `reeditpro-staging-deepfilternet-runtime-job-w2v5x`: passed artifact copy and
  generated fixture work, but DeepFilterNet CLI failed because v0.5.6 uses
  `--output-dir`, not `--out-dir`.
- `reeditpro-staging-deepfilternet-runtime-job-pxjbq`: completed generated-audio
  DeepFilterNet runtime verification with no blocking QA failures.

## IAM

Existing narrow Phase 36C IAM bindings remain:

- `roles/storage.objectViewer` for the approved Phase 36B DeepFilterNet artifact
  prefix.
- An additional object-context `roles/storage.objectViewer` binding for the same
  artifact prefix.
- `roles/storage.objectCreator` on Phase 36C generated, analysis, QA, and
  worker-temp prefixes.

Additional diagnostic bindings were added while isolating the earlier blocker:

- managed-folder `roles/storage.objectViewer` on
  `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- bucket-level exact-object `roles/storage.objectViewer` for the seven approved
  Phase 36B artifacts.
- project-level exact-object `roles/storage.objectViewer` for the same seven
  approved Phase 36B artifacts.

No `storage.admin`, `storage.objectAdmin`, owner/editor, public principal, broad
bucket read/write, signed URL, public URL, or secret was added.

## Runtime Artifacts

Generated assets:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/fixture/generated-clean-reference.wav`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/fixture/generated-noisy-input.wav`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/fixture/audio-fixture-manifest.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/enhanced/deepfilternet-enhanced.wav`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/metadata/model-checksum-verification.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-audio-ai/phase36c/phase36c-20260530T133009/metadata/deepfilternet-runtime-metadata.json`

Analysis artifacts:

- `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-audio-ai/phase36c/phase36c-20260530T133009/audio-metrics/input-metrics.json`
- `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-audio-ai/phase36c/phase36c-20260530T133009/audio-metrics/output-metrics.json`
- `gs://reeditpro-staging-reeditpro-analysis-artifacts/activation-audio-ai/phase36c/phase36c-20260530T133009/audio-metrics/comparison-metrics.json`

QA artifacts:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36c/phase36c-20260530T133009/qa/deepfilternet-runtime-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-audio-ai/phase36c/phase36c-20260530T133009/reports/phase36c-report.json`

No runtime artifact was committed to git.

## Metrics

- Input duration: 10s
- Output duration: 10s
- Duration delta: 0s
- Input RMS: -16.954 dBFS
- Output RMS: -44.052 dBFS
- Input peak: -7.934 dBFS
- Output peak: -19.679 dBFS
- Output clipping samples: 0
- Interpretation: generated-audio runtime sanity metric only; subjective quality
  and real-media cleanup remain unapproved.

## QA Summary

- `model_artifacts`: passed; approved Phase 36B CLI and ONNX archive copied from
  private GCS and SHA-256 verified.
- `runtime_integrity`: passed; approved DeepFilterNet CLI completed in CPU-only
  Cloud Run job.
- `fixture_integrity`: passed; generated 48 kHz mono synthetic clean/noisy WAV
  fixture and used no real media.
- `enhanced_audio_artifacts`: passed; enhanced WAV exists and decoded for
  metrics.
- `audio_safety_metrics`: passed; RMS, peak dBFS, duration, and clipping metrics
  were recorded.
- `artifact_privacy`: passed; artifacts were written only to private staging GCS
  buckets with no public or signed URLs.
- `blocked_features`: passed; real media, RNNoise, Demucs, providers, Revideo,
  FILM, slow motion, production, beta, and broad-media paths remain blocked.

QA status is `warning` only because generated fixture verification does not
prove real-video audio cleanup quality.

## Phase36D Readiness

Ready for controlled real-video audio AI cleanup sample planning/execution only.
Phase 36D may use this generated-audio runtime proof to plan one bounded sample
on the approved controlled real-video chain. It is not ready for arbitrary real
media, external beta, paid production, or broad real media.

## Blocked Scope

Real video/audio AI cleanup, arbitrary user media, RNNoise, Demucs, providers,
Revideo, FILM, slow motion, production, external beta, paid production, and
broad real media remain blocked after Phase 36C.
