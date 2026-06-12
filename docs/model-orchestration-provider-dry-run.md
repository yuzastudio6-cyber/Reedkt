# Model Orchestration Qwen/DeepSeek Provider Dry-Run

Decision: `not_attempted`.

Status: `not_attempted`.

This phase executes only synthetic, non-sensitive provider dry-run cases approved by PR #318. Qwen/DashScope calls use the OpenAI-compatible chat completions endpoint, and DeepSeek calls use its OpenAI-compatible chat completions endpoint with JSON-object response formatting.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Raw provider responses, API keys, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
