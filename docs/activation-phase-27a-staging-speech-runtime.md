# Phase 27A Staging CPU Speech Runtime

Phase 27A adds the first staging runtime verification for the approved tiny
speech/caption model.

It introduces a dedicated `speech-worker` container so the existing CPU analysis
image can keep its no-model-tool policy. The speech image contains
`faster-whisper` and `ctranslate2`, but no model weights, GPU packages, provider
SDKs, non-speech model packages, or Revideo.

Execution target:

- Cloud Run Job: `reeditpro-staging-speech-runtime-job`
- Service account: `reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com`
- Image tag: `staging-speech-cpu-001`
- Platform: `linux/amd64`
- Model: `faster_whisper_tiny_staging_v1`

Phase 28 becomes controlled speech/caption execution-ready only after the job
loads the model from private GCS and completes generated-audio transcription.
