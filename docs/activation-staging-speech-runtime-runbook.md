# Staging Speech Runtime Runbook

Phase 27A verifies one CPU-only staging speech runtime path for the approved
`Systran/faster-whisper-tiny` model.

Run only with:

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_STAGING_SPEECH_RUNTIME=true`
- `REEDITPRO_IMAGE_TAG=staging-speech-cpu-001`

The runtime copies the approved model from private GCS, generates a tiny audio
fixture inside the container, runs faster-whisper on CPU with the local model
path, and uploads a private verification report to the worker-temp bucket.

It must not use real media, providers, GPU, secrets, public buckets, or runtime
Hugging Face downloads.
