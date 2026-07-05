# Qwen2.5-VL Runtime Beta Implementation

RP-QWENVL-BETA-01 adds a backend-only beta path for marker visual context. The browser samples resized still frames from the local preview video only after the user clicks Analyze Visual Context, then sends those request-only frame images to `/v1/project-edit-brief/marker-visual-context`.

Runtime modes are `qwen25vl_live`, `qwen25vl_fake`, `deterministic_visual_fallback`, `blocked_missing_beta_config`, `blocked_provider_error`, and `blocked_validation_error`. Dedicated config uses `REEDITPRO_QWEN25VL_RUNTIME_MODE`, `QWEN25VL_API_KEY_SECRET`, `QWEN25VL_BASE_URL(_SECRET)`, `QWEN25VL_MODEL_ID(_SECRET)`, `QWEN25VL_TRANSPORT_PROFILE`, `QWEN25VL_REQUEST_PATH`, `QWEN25VL_TIMEOUT_MS`, and `QWEN25VL_MAX_RETRIES`.

The beta path does not upload full video, read backend media bytes, run FFmpeg/FFprobe/Whisper/SoundSync, use DeepSeek, call Qwen 3.7 Max for visual analysis, create workers, render/export, reserve credits, run Supabase CLI, or create migrations. Missing config and invalid provider responses return deterministic fallback and must not claim live Qwen2.5-VL analysis.
