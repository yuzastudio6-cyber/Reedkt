# Model Orchestration Qwen/DeepSeek Provider Dry-Run

Decision: `provider_dry_run_passed_ready_for_plan_snapshot_contract`.

Status: `passed`.

This phase executes only two synthetic, non-sensitive provider dry-run cases approved by PR #318 and gated by PR #330 timeout calibration. Qwen/DashScope uses the US OpenAI-compatible chat completions endpoint from Google Secret Manager, and DeepSeek uses its OpenAI-compatible chat completions endpoint with JSON-object response formatting.

Qwen default: `qwen3.7-plus` with `45000ms` timeout and `650` max output tokens. DeepSeek default: `deepseek-v4-flash`. Escalation models are policy-only in this phase and are not called.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Raw provider responses, API keys, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
