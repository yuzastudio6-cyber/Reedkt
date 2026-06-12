# Model Orchestration Provider Dry-Run Fix Result

Decision: `blocked_pending_dashscope_secret_or_permission_setup`.

Status: `blocked`.

This fix pass classifies the PR #320 Qwen/DashScope blocker without rerunning provider calls. PR #320 remains the historical dry-run source: Qwen/DashScope attempted four approved synthetic cases and all four blocked with HTTP 401 `provider_auth_or_permission_failed`. DeepSeek passed its three approved synthetic cases and that evidence is preserved without rerun.

Diagnosis: `qwen_secret_present_but_rejected`. The source reports show the `DASHSCOPE_API_KEY` ref was accessible through exact approved handling, but DashScope rejected the provider calls. The endpoint and model aliases remain source-of-truth consistent, so this pass treats the blocker as external DashScope secret, workspace, region, or model-call permission setup.

External context reviewed: Alibaba Cloud Model Studio documents region-specific OpenAI-compatible base URLs and notes that API keys can differ by region. Its sub-workspace model calling docs also describe workspace-scoped keys and model-call permissions.

Qwen/DashScope rerun: `not_attempted`.

DeepSeek rerun: `not_attempted_preserved`.

Plan snapshot contract ready: `false`.

Raw provider output persisted: `false`.

Secret payloads printed, committed, or stored: `false`.

Still blocked: workers, tools, routes, raw prompt execution, media processing, Supabase writes, SQL, migrations, storage writes, public artifacts, signed URLs, generated assets, credit spend/reservation, production, external beta, paid production, Demucs runtime, Track A runtime, and Qwen/VLM runtime beyond an approved synthetic repair rerun.

Recommended next prompt: `MODEL-ORCHESTRATION-QWEN-DEEPSEEK-SECRET-SETUP: verify provider secret refs/permissions, no provider calls`.
