# Qwen Provider Transport

The Qwen 3.7 Max beta transport is config-driven. Supported profiles are `openai_chat_completions` and `generic_json_post`.

The default beta profile is OpenAI-compatible chat completions. It uses a configured base URL, request path, model ID, timeout, and one safe retry for timeout, 429, or 5xx responses when configured. The generic JSON POST profile sends a system/user prompt pair and the structured response schema name.

## Logging Boundary

Authorization headers are constructed server-side and never logged. Raw provider credentials, raw Secret Manager values, and unredacted raw provider responses are not persisted. Only redacted previews and structured validation results are exposed.

## Side Effects

Provider calls can occur only when beta gates pass. Even then, the transport does not render, run workers, process media, fetch source URLs, read file bytes, write Supabase, or reserve/spend credits. Production ready: false.

Boundary phrase: Qwen 3.7 Max beta is backend-only, uses Secret Manager, keeps deterministic fallback, no render, no workers, no credits, and production ready: false.

## Qwen2.5-VL Transport Split

Qwen2.5-VL visual context uses the separate transport docs in `qwen25vl-provider-transport.md`. Qwen 3.7 Max Marker Chat transport must not receive sampled frame payloads or raw video/audio; it may receive compact visual summaries only in a future context-aware Marker Chat milestone.
