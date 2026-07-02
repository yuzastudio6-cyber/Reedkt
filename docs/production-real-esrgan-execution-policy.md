# Production Real ESRGAN Execution Policy

Real-ESRGAN is the planned M15D restoration/upscale engine for sample-first enhancement only. It is not applied blindly to every clip.

Production Real-ESRGAN execution requires an approved `real_esrgan_model` manifest, GPU/tool readiness, approved snapshot metadata, idempotency, private artifact refs, and passing enhancement QA. Current `needs_review` model templates block production.

Local-dev execution is skip-safe: if the tool, source media, or local model path is unavailable, the runner returns a structured skip reason. M15D never downloads model weights and never final renders enhanced media.
