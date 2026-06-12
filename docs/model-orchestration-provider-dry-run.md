# MODEL-DRYRUN-2 Calibrated Qwen/DeepSeek Provider Dry-Run

Decision: `blocked_pending_cost_review`.

Status: `blocked`.

MODEL-DRYRUN-2 retries only the approved synthetic provider dry-run after MODEL-TIMEOUT-1. Qwen/DashScope uses the calibrated target `qwen3.7-plus`, `non_streaming`, `45000ms`, and `650` max output tokens. DeepSeek remains the existing approved synthetic control path.

DashScope config is resolved only from Google Secret Manager refs `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, and `DASHSCOPE_REGION`; the base URL must match `https://dashscope-us.aliyuncs.com/compatible-mode/v1` and region `us` before Qwen calls run.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Raw provider responses, API keys, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
