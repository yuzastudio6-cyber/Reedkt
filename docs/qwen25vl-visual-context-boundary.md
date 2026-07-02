# Qwen2.5-VL Visual Context Boundary

Allowed in RP-QWENVL-BETA-01: explicit user action, browser-local frame sampling, resized sampled frame images sent to the backend visual route, backend-only Qwen2.5-VL live or fake beta runtime, structured validation, deterministic fallback, and mock/local marker metadata persistence of the summary only.

Not allowed: full-video upload, durable media storage, backend media byte reads, external URL fetches, FFmpeg/FFprobe, Whisper, SoundSync runtime, DeepSeek, Qwen 3.7 visual analysis, workers, render/export, planner execution, credit reservation/spend, Supabase CLI, migrations, or ChatNativeEditor changes.

The route and UI must never expose provider headers, secret values, raw provider payloads, raw sampled frames after request completion, credentials, or chain-of-thought.
