# Phase 36C DeepFilterNet Runtime Policy

Phase 36C is an execution-approved runtime verification phase for generated
synthetic audio only.

## Allowed

- Build and push the dedicated DeepFilterNet CPU runtime image.
- Deploy/update `reeditpro-staging-deepfilternet-runtime-job`.
- Grant only missing prefix-scoped conditional storage IAM to
  `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`.
- Copy the approved Phase 36B artifacts from private staging GCS.
- Verify SHA-256 checksums.
- Generate a deterministic 48 kHz mono WAV fixture.
- Run:
  `deep-filter --model <local DeepFilterNet3_onnx.tar.gz> --out-dir <enhanced-dir> <generated-noisy-input.wav>`.
- Upload private generated-audio, enhanced-audio, metrics, QA, and report
  artifacts.

## Not Allowed

- Real video or real audio input.
- Arbitrary user media.
- Any Phase 28-35 real-video chain input.
- External model/tool downloads at runtime.
- Alternate DeepFilterNet versions or model archives.
- RNNoise or Demucs runtime.
- Providers, Revideo, FILM, slow motion, public URLs, public bucket access,
  production, external beta, paid production, or broad real media.

## Readiness Meaning

A successful Phase 36C result means only that Phase 36D may plan one controlled
real-video audio AI cleanup sample. It does not approve production, external
beta, arbitrary media, RNNoise, Demucs, providers, or final export use.
