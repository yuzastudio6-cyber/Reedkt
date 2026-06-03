# Phase 36H DeepFilterNet Linux Runtime Completion

Phase 36H-LINUX completes the blocked Phase 36H DeepFilterNet runtime-hardening follow-up on an approved `linux/amd64` CPU runtime. The initial PR #140 implementation remains preserved: local macOS execution blocks because the approved `deep-filter-0.5.6-x86_64-unknown-linux-musl` binary is not compatible with `darwin_arm64`, and the local host did not have ffmpeg for bounded controlled audio extraction.

The completion path uses a private Cloud Run Job only when the required current-shell confirmations are set. It builds a narrow CPU-only image with ffmpeg/ffprobe and the Phase 36H Linux worker, then copies the approved private DeepFilterNet v0.5.6 binary/model artifacts at runtime and verifies SHA-256 before execution.

## Runtime Scope

- Project: `reeditpro`
- Region: `us-central1`
- Image: `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/deepfilternet-runtime-phase36h:phase36h-linux-deepfilternet-runtime-completion-20260603-r5`
- Job: `reeditpro-stg-deepfilternet-runtime-phase36h`
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- CPU-only, no GPU
- No public service endpoint
- No production traffic

## Execution Order

1. Runtime smoke: linux/amd64, ffmpeg, ffprobe, approved binary checksum, approved model checksum, model manifest aggregate checksum, `deep-filter --version`, and `deep-filter --help`.
2. Generated 48 kHz mono noisy speech-like fixture.
3. One approved private controlled sample only, bounded to `6.9s-8.9s`.
4. Private artifact upload to `gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase36h/deepfilternet-controlled-speech/phase36h-linux-deepfilternet-runtime-completion-20260603-r5/`.

Signalsmith Stretch, Demucs, VLM, OCR, providers, broad media, arbitrary media, public output, beta, production, and Track A remain blocked.

The private upload path required only prefix-scoped `roles/storage.objectCreator` and `roles/storage.objectViewer` bindings for the CPU worker service account under `activation/phase36h/deepfilternet-controlled-speech/`; no broad IAM or public access was granted.
