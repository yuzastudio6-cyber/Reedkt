# Model Orchestration Qwen DashScope Auth Repair

Decision: `qwen_auth_repaired_ready_for_provider_dry_run_update`.

Status: `blocked`.

This server-only packet repairs the Qwen/DashScope side of PR #320 by probing US DashScope auth aliases first: `qwen-plus-us`, `qwen-flash-us`. Approved target aliases are probed only after a US auth probe passes: `qwen3.7-plus`, `qwen3.7-max`, `qwen3-max`, and `qwen-max`.

Operator key replacement evidence: `DASHSCOPE_API_KEY` version `3` is reported as the correct-region replacement. `DASHSCOPE_BASE_URL` and `DASHSCOPE_REGION` version `1` are validated through Google Secret Manager at execution time. Payload printed or committed: `false`.

Default endpoint key: `us`. The base URL and region payloads are matched internally against approved US values and are not written into reports. Beijing and Singapore endpoints are not probed in this repair packet.

Selected alias: `qwen3.7-plus`.

DeepSeek is not rerun in this phase. PR #320 DeepSeek evidence is reused as metadata only.

Still blocked: tools, workers, routes, media processing, Supabase writes, raw prompt execution into workers or tools, public artifacts, signed URLs, production, external beta, and paid production.

Secret payloads, raw provider responses, DB URLs, service-role keys, access tokens, signed URLs, private payloads, and media payloads are not committed.
