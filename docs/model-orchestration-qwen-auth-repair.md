# Model Orchestration Qwen DashScope Auth Repair

Decision: `qwen_alias_repaired_ready_for_plan_snapshot_contract`.

Status: `passed`.

This server-only packet repairs the Qwen/DashScope side of PR #320 by probing current official Qwen aliases in order: `qwen-plus`, `qwen3-max`, and `qwen-max`. The PR #320 `qwen3.7-plus` and `qwen3.7-max` aliases are not used in this repair probe.

Operator key replacement evidence: `DASHSCOPE_API_KEY` version `3` is reported as the correct-region replacement, and this packet selects `latest` at execution time. Payload printed or committed: `false`.

Default endpoint: `https://dashscope.aliyuncs.com/compatible-mode/v1`. The Virginia endpoint is recorded as official evidence but is probed only when current-process metadata explicitly selects it. The Singapore endpoint requires a safe WorkspaceId review before use.

Selected alias: `qwen-plus`.

DeepSeek is not rerun in this phase. PR #320 DeepSeek evidence is reused as metadata only.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Secret payloads, raw provider responses, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
