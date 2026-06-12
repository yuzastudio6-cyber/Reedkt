# MODEL-DRYRUN-2 Results

Status: `blocked`.

Final state: `blocked_provider_call_failed`.

Run ID: `modeldryrun2-20260612T180334`.

Pull request: https://github.com/yuzastudio6-cyber/Reedkt/pull/333

Qwen/DashScope status: `passed`.

DeepSeek status: `passed`.

Provider calls attempted: `7`.

Private artifact upload status: `not_attempted_provider_dry_run_not_passed`.

Supabase update required: `docs/status only`.

Supabase update status: `docs_only`.

Supabase environment touched: `none`.

SQL executed: `none`.

Migration deployed: `no`.

Next recommended prompt: `MODEL-DRYRUN-2A - Calibrated Provider Dry-Run Fixes`.

## Validation

Passed:

- `git diff --check`
- `git diff --check origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration...HEAD`
- `npm ci`
- `npm run smoke:activation-model-provider-dry-run`
- `npm run activation:model-provider-dry-run:report`
- `npm run activation:model-provider-dry-run:iam-plan`
- `npm run activation:model-provider-dry-run:summary`
- guarded execute command, with final CLI exit code `1` because the run failed closed on `provider_cost_or_token_guardrail_exceeded`
- `npm run --silent model-provider:dryrun-2:diagnostics`
- `npm run smoke:activation-model-orchestration-qwen-auth-repair`
- `npm run activation:model-orchestration-qwen-auth-repair:report`
- `npm run activation:model-orchestration-qwen-auth-repair:summary`
- `npm run smoke:activation-qwen-timeout-calibration`
- `npm run activation:qwen-timeout-calibration:report`
- `npm run activation:qwen-timeout-calibration:summary`
- `npm run activation:model-orchestration-dry-run-approval:report`
- `npm run activation:model-orchestration-qwen-deepseek-audit:report`
- `npm run prod:readiness:summary`
- `npm run prod:beta:summary`
- `npm run lint`
- `npm run typecheck:server`
- `npx tsc -b`
- `npm run build`
- `npm run build:server`
- changed-file secret scan

Local environment note: git commands required `DEVELOPER_DIR=/Library/Developer/CommandLineTools` because the host Xcode shim points at a missing `/Applications/Xcode.app/Contents/Developer`.

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.
