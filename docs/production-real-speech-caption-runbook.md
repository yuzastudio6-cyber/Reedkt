# Production Real Speech Caption Runbook

Modes:

- `dry_run`: validates payloads, uses a mock transcript, builds private artifact summaries, and runs caption QA.
- `local_dev`: can run faster-whisper only if explicitly enabled and local tool/model/audio paths already exist.
- `container_ready`: prepares payload/command plan metadata without running Docker or host tools.
- `production_blocked`: refuses real transcription/render.
- `production_ready`: remains blocked unless approved snapshot, execution plan, idempotency key, approved model-weight manifest, private storage refs, and readiness gates pass.

To test with a local model, provide an existing local audio path, existing local model path, safe output directory, `enableRealTranscription=true`, and `allowModelDownload=false`. Do not run model downloads.
