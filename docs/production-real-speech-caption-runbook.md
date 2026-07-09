# Production Real Speech Caption Runbook

Modes:

- `dry_run`: validates payloads, uses a mock transcript, builds private artifact summaries, and runs caption QA.
- `local_dev`: can run faster-whisper only if explicitly enabled and local tool/model/audio paths already exist.
- `container_ready`: prepares payload/command plan metadata without running Docker or host tools.
- `production_blocked`: refuses real transcription/render.
- `production_ready`: remains blocked unless approved snapshot, execution plan, idempotency key, approved model-weight manifest, private storage refs, and readiness gates pass.

To test with a local model, provide an existing local audio path, existing local model path, safe output directory, `enableRealTranscription=true`, and `allowModelDownload=false`. The default local-dev runner uses the `faster_whisper.WhisperModel` Python package API and writes ReEditPro-normalized JSON output. Do not run model downloads.

Internal real-video testing uses `REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_PATH` for the already-approved local model directory, `REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_MODEL_MANIFEST_PATH` for the local model approval manifest, and optional `REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_PYTHON_COMMAND` for a Python binary that can import `faster_whisper`. `REEDITPRO_INTERNAL_TESTING_FASTER_WHISPER_COMMAND` remains an explicit CLI override when a reviewed compatible wrapper is provided. If the manifest, model path, or runtime package/command is missing, the smokes record `manifest_path_missing`, `local_model_missing`, or `faster_whisper_runtime_missing`, keep placeholder caption wiring separate from source truth, and block final export.

Use `npm run test:internal-testing:real-video-end-to-end-readiness` as the single local operator acceptance command for the current internal testing path. It verifies upload, prompt-to-plan, approval/credit reservation, private preview, media foundation, speech/caption handoff, and smart-cut preview against the configured real MP4, then reports whether the remaining content-aware edit blocker is the local faster-whisper model/runtime gate.

Use `npm run test:internal-testing:real-video-transcription-prerequisite-manifest` before accepting real transcript content from a local model. The manifest template lives at `docs/internal-testing-faster-whisper-model-manifest.template.json`.
