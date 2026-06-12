# Model Orchestration Qwen DashScope Auth Repair

Decision: `blocked_pending_dashscope_key_replacement`.

Status: `blocked`.

This server-only packet repairs the Qwen/DashScope side of PR #320 by probing current official Qwen aliases in order: `qwen-plus`, `qwen3-max`, and `qwen-max`. The PR #320 `qwen3.7-plus` and `qwen3.7-max` aliases are not used in this repair probe.

Default endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1`. The Virginia endpoint is recorded as official evidence but is probed only when current-process metadata explicitly selects it. The Singapore endpoint requires a safe WorkspaceId review before use.

Selected alias: `none`.

DeepSeek is not rerun in this phase. PR #320 DeepSeek evidence is reused as metadata only.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Secret payloads, raw provider responses, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
