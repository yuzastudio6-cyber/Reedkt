# Production Faster Whisper Execution Policy

faster-whisper is worker-only. Production execution requires approved snapshot IDs, a tool execution plan ID, an idempotency key, private source audio artifact refs, and an approved `faster_whisper_model` model-weight manifest.

Unknown, non-commercial, missing, `needs_review`, or blocked model weights block production execution. Code/package license approval does not approve model/checkpoint weights.

Local-dev execution skips when faster-whisper, source audio, output root, or local model path is unavailable. The default runtime check validates that the configured Python binary can import `faster_whisper.WhisperModel`; explicit CLI overrides are checked separately. Missing Python package API or CLI readiness is recorded as `faster_whisper_runtime_missing` instead of being treated as an accepted transcript attempt. No command may include model download flags, arbitrary args, raw prompts, signed URLs, service-role keys, provider keys, or secrets.

The newer canonical Cloud Run GPU preflight is candidate-only and does not
reuse this local path/subprocess lane as production authority. It binds one
private 16 kHz mono WAV artifact, four checksum-protected model artifacts,
fixed CUDA/float16 settings, and approved snapshot/work/reservation/lease
lineage. Faster Whisper remains outside the callable 50-tool registry until a
later promotion proves the full canonical private lifecycle.
