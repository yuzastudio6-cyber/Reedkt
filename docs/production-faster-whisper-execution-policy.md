# Production Faster Whisper Execution Policy

faster-whisper is worker-only. Production execution requires approved snapshot IDs, a tool execution plan ID, an idempotency key, private source audio artifact refs, and an approved `faster_whisper_model` model-weight manifest.

Unknown, non-commercial, missing, `needs_review`, or blocked model weights block production execution. Code/package license approval does not approve model/checkpoint weights.

Local-dev execution skips when faster-whisper, source audio, output root, or local model path is unavailable. No command may include model download flags, arbitrary args, raw prompts, signed URLs, service-role keys, provider keys, or secrets.
