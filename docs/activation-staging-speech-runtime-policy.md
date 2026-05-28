# Staging Speech Runtime Policy

Phase 27A is limited to CPU runtime verification for
`faster_whisper_tiny_staging_v1`.

Allowed:

- dedicated CPU speech runtime image
- private GCS model copy from the approved Phase 26B path
- generated WAV fixture only
- faster-whisper CPU execution against the local copied model
- private runtime verification report

Blocked:

- GPU deployment or execution
- external model download at runtime
- larger or non-speech models
- real user media or arbitrary media input
- provider calls
- secret values
- public access
- production, paid production, external beta, or broad real user media unlock
