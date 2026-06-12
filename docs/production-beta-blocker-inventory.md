# Production Beta Blocker Inventory

Session 0 owned blocker inventory with model orchestration dry-run approval status.

- `external_beta`: blocked
- `paid_production`: blocked
- `production`: blocked
- `public_artifacts`: blocked
- `signed_url_source_of_truth`: blocked
- `runtime_tool_worker_provider_execution`: blocked
- `raw_prompt_execution`: blocked
- `supabase_production_writes`: blocked

Model orchestration Qwen/DeepSeek dry-run approval decision: `approved_for_future_qwen_deepseek_provider_dry_run`.

MODEL-DRYRUN-1 execution status: `blocked_provider_call_failed`.

MODEL-DRYRUN-1A execution status: `blocked_pending_dashscope_secret_rotation_by_owner`.

MODEL-DRYRUN-1B execution status: `blocked_pending_dashscope_secret_rotation_by_owner`.

- Secret Manager payload resolution: passed without printed or committed secret values.
- Secret Manager metadata-only review: latest enabled `DASHSCOPE_API_KEY` version was newer than the first failed run, so the approved retry gate was satisfied.
- DeepSeek `deepseek-v4-flash` synthetic case: passed again with sanitized committed metadata only.
- Qwen/DashScope `qwen3.7-plus` synthetic case: still blocked by provider HTTP 401 `Incorrect API key provided`.
- MODEL-DRYRUN-1B metadata-only review: no new enabled `DASHSCOPE_API_KEY` version was visible after MODEL-DRYRUN-1A, so no provider retry ran.
- Owner-side blocker: repair or rotate DashScope secret/account/model-region entitlement and produce a new safe enabled Secret Manager version before the next provider retry.

Provider integration, real user data, media processing, worker execution, tool execution, route execution, public artifacts, signed URLs, Supabase mutation, SQL, migrations, external beta, paid production, and production remain blocked.
