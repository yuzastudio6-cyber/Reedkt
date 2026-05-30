# Phase 36A Audio AI Artifact Policy

Phase 36A commits code, docs, and sanitized evidence only.

## Allowed

- Tool/source/license evidence summaries
- Text-only future command plans
- Risk register and readiness status
- Report-only CLI output

## Blocked

- model weights
- downloaded model/config files
- audio files
- generated media
- private GCS report JSON
- runtime logs
- credentials or secret values
- signed URLs or public URLs as source of truth
- Docker/GCP mutation output

Future Phase 36B may use private staging storage under
`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/<tool>/<model>/`
only after an exact artifact source and checksum plan are approved.
