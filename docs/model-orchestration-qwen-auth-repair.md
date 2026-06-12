# Model Orchestration Qwen DashScope Auth Repair

Decision: `qwen_alias_repaired_ready_for_plan_snapshot_contract`.

Status: `passed`.

This server-only packet repairs the Qwen/DashScope side of PR #320 by probing only official Qwen aliases in this order: `qwen-plus`, `qwen3-max`, and `qwen-max`. Canonical green evidence for PR #327 requires selected alias `qwen-plus`.

Operator key replacement evidence: `DASHSCOPE_API_KEY` version `3` is reported as the correct-region replacement. The approved base URL classification is `virginia_dashscope_base_url`. Payload printed or committed: `false`.

Default endpoint key: `virginia`. Beijing is recorded as alternate official documentation evidence but is not selected for canonical green evidence. Singapore remains blocked without a safe WorkspaceId approval.

Selected alias: `qwen-plus`.

DeepSeek is not rerun in this phase. PR #320 DeepSeek evidence is reused as metadata only.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Secret payloads, raw provider responses, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
