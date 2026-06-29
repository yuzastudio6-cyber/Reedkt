# Phase 36G Audio Stack Demucs Artifact Policy

Phase 36G does not create model, media, Docker, Cloud Run, or GCS runtime
artifacts.

The planned but blocked Demucs model target is:

`gs://reeditpro-staging-reeditpro-generated-assets/model-weights/audio-ai/demucs/htdemucs/`

No file may be uploaded there until a later phase records clear official model
license/provenance evidence and exact checksums.

Do not commit:

- Demucs model files
- generated or separated audio
- review MP4s
- private GCS JSON reports
- logs
- credentials
- large binaries
