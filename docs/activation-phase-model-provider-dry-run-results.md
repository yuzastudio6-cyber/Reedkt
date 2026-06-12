# MODEL-DRYRUN-1 Qwen/DeepSeek Synthetic Provider Dry-Run Results

Status: `blocked`

Run ID: `modeldryrun1-20260612T153356`

Branch: `codex/rp-model-orchestration-qwen-dashscope-auth-repair`

PR stack:
- PR #322: `[model] Qwen DashScope auth repair`
- PR #320: `[model] Qwen DeepSeek provider dry-run`
- PR #318: `[model] Qwen DeepSeek dry-run approval packet`

## Execution

Guarded Qwen/DashScope auth repair was executed with provider key environment variables explicitly unset and provider secret payload resolution limited to Google Secret Manager.

Result: `blocked_pending_dashscope_key_replacement`

Active blocker: `provider_auth_or_permission_failed`

Official Qwen aliases probed:
- `qwen-plus`: blocked with HTTP `401`
- `qwen3-max`: blocked with HTTP `401`
- `qwen-max`: blocked with HTTP `401`

Stale PR #320 aliases `qwen3.7-plus` and `qwen3.7-max` were not probed in the repair packet.

## Dry-Run Status

Full Qwen/DeepSeek synthetic provider dry-run was not executed because Qwen/DashScope auth did not pass.

DeepSeek was not rerun in this phase. Existing PR #320 DeepSeek evidence remains metadata only until the Qwen blocker is repaired and the full dry-run can be rerun.

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
- `npm run smoke:activation-model-orchestration-provider-dry-run`
- `npm run activation:model-orchestration-provider-dry-run:report`
- `npm run activation:model-orchestration-provider-dry-run:summary`
- `npm run activation:model-orchestration-provider-dry-run:iam-plan`
- `npm run smoke:activation-model-provider-dry-run`
- `npm run activation:model-provider-dry-run:report`
- `npm run activation:model-provider-dry-run:summary`
- `npm run activation:model-provider-dry-run:iam-plan`
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

Package lock: `unchanged`

## Next Step

Human action required: repair or replace the DashScope key, enable the required Model Studio/Bailian service, grant model access, or correct the approved DashScope region/workspace metadata. After that, rerun PR #322’s Qwen-only repair packet before attempting the full Qwen/DeepSeek provider dry-run.
