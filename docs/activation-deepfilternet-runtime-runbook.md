# Phase 36C DeepFilterNet Runtime Runbook

Phase 36C verifies the approved DeepFilterNet `v0.5.6` artifacts on generated
synthetic audio only.

## Inputs

- Approved artifact prefix:
  `gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/deepfilternet/v0.5.6/`
- CLI: `deep-filter-0.5.6-x86_64-unknown-linux-musl`
- Model archive: `DeepFilterNet3_onnx.tar.gz`
- Runtime image:
  `us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-deepfilternet-runtime:staging-deepfilternet-runtime-001`
- Cloud Run Job: `reeditpro-staging-deepfilternet-runtime-job`
- Service account:
  `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`

## Required Confirmation

Execution requires:

```sh
GCP_PROJECT_ID=reeditpro
GCP_REGION=us-central1
REEDITPRO_ENV=staging
REEDITPRO_CONFIRM_DEEPFILTERNET_RUNTIME=true
```

The runtime must also enforce:

- `REEDITPRO_DEEPFILTERNET_RUNTIME_MODE=generated_audio`
- `GENERATED_AUDIO_ONLY=true`
- `REAL_MEDIA_INPUT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `RNNOISE_ENABLED=false`
- `DEMUCS_ENABLED=false`
- `REEDITPRO_PRODUCTION_READY=false`

## Execution Flow

1. Verify active GCP account/project and private staging buckets.
2. Verify the Phase 36B DeepFilterNet CLI, ONNX archive, and manifest exist in
   private GCS.
3. Add only missing conditional prefix-scoped IAM for the CPU worker service
   account.
4. Build the dedicated Node runtime worker.
5. Build/push the linux/amd64 CPU-only Docker image.
6. Deploy/update the Cloud Run Job with 4 CPU, 8Gi memory, parallelism 1, and
   max retries 0.
7. Execute once.
8. Worker copies only private Phase 36B artifacts, verifies SHA-256 checksums,
   generates deterministic synthetic audio, runs the approved `deep-filter`
   CLI, uploads private QA/artifacts, and cleans temp files.

## Blocked

Real video/audio input, arbitrary user media, RNNoise, Demucs, providers,
Revideo, FILM, slow motion, external model downloads, production, external
beta, paid production, and broad real media remain blocked.
