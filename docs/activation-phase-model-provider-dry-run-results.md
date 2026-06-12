# MODEL-DRYRUN-1 Qwen/DeepSeek Synthetic Provider Dry-Run Results

Status: `blocked`

Run ID: `modeldryrun1-20260612T162802`

Branch: `codex/rp-model-orchestration-qwen-dashscope-auth-repair`

PR stack:
- PR #322: `[model] Qwen DashScope auth repair`
- PR #320: `[model] Qwen DeepSeek provider dry-run`
- PR #318: `[model] Qwen DeepSeek dry-run approval packet`

## Execution

Guarded Qwen/DashScope auth repair was executed with `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, `DASHSCOPE_REGION`, provider key, and Supabase payload environment variables explicitly unset. Provider secret payload resolution was limited to the three exact Google Secret Manager refs.

Result: `qwen_auth_repaired_ready_for_provider_dry_run_update`

Active blocker: `provider_timeout`

Secret Manager validation:
- `DASHSCOPE_API_KEY`: version `3`, payload accessed process-local only.
- `DASHSCOPE_BASE_URL`: version `1`, matched approved US endpoint internally.
- `DASHSCOPE_REGION`: version `1`, matched `us` internally.

US auth probes:
- `qwen-plus-us`: passed with HTTP `200`
- `qwen-flash-us`: passed with HTTP `200`

Approved target alias probes:
- `qwen3.7-plus`: passed with HTTP `200`
- `qwen3.7-max`: passed with HTTP `200`
- `qwen3-max`: passed with HTTP `200`
- `qwen-max`: blocked with HTTP `404` / `qwen_model_alias_unavailable`

Selected approved target alias: `qwen3.7-plus`

## Dry-Run Status

The full Qwen/DeepSeek synthetic provider dry-run was not executed in this pass. DeepSeek was not rerun; existing PR #320 DeepSeek evidence remains metadata only.

Qwen schema repair attempted the four approved synthetic cases against `qwen3.7-plus`; all four timed out within the existing bounded timeouts, so plan snapshot readiness remains `false`.

## Safety

Secret payloads printed or committed: `false`

Raw provider responses stored or printed: `false`

Tools, workers, routes, provider chaining, browser capture, map rendering, media processing, raw prompt execution, public artifacts, signed URLs, production, external beta, and paid production remain blocked.

## Supabase

Supabase milestone sync: `not_attempted_current_branch_missing_sync_layer`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

Schema/RLS changes: `none`

## Validation

Passed:
- `npm run smoke:activation-model-orchestration-qwen-auth-repair`
- `npm run activation:model-orchestration-qwen-auth-repair:report`
- `npm run activation:model-orchestration-qwen-auth-repair:summary`
- `npm run activation:model-orchestration-provider-dry-run:report`
- `npm run activation:model-orchestration-provider-dry-run:summary`
- `npm run activation:model-provider-dry-run:report`
- `npm run activation:model-provider-dry-run:summary`
- `npm run activation:model-orchestration-dry-run-approval:report`
- `npm run activation:model-orchestration-qwen-deepseek-audit:report`
- `npm run prod:readiness:summary`
- `npm run prod:beta:summary`
- `npm run lint`
- `npm run typecheck:server`
- `npx tsc -b`
- `npm run build`
- `npm run build:server`
- `git diff --check`
- `git diff --cached --check`
- Changed-file credential pattern scan

Validation failures: `0`

Package lock: `unchanged`

## Next Step

Qwen/DashScope auth and approved target access are repaired for the US region. The next blocker is bounded schema-case timeout on `qwen3.7-plus`; resolve with an approved timeout/model/target adjustment before attempting the full Qwen/DeepSeek provider dry-run or plan snapshot contract.
