# Activation Model Download Runbook

Phase 26B downloads only the approved `Systran/faster-whisper-tiny` model
weights for private staging storage.

Required guards:

- `GCP_PROJECT_ID=reeditpro`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_MODEL_WEIGHT_DOWNLOAD=true`
- active `gcloud` project must be `reeditpro`
- Phase 26 approval report must show `faster_whisper_tiny_staging_v1`

The model must be downloaded outside the repo, under
`/tmp/reeditpro-model-download/`, and uploaded to:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/faster-whisper/tiny/`

Do not download any other model, commit model files, create public objects,
create signed URLs as source of truth, deploy GPU, run transcription, process
real media, or unblock production/external beta.
