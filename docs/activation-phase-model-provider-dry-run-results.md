# MODEL-DRYRUN-2 Calibrated Qwen/DeepSeek Synthetic Provider Dry-Run Results

Status: `blocked`

Final state: `blocked_provider_call_failed`

Run ID: `modeldryrun2-20260612T180334`

Branch: `codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run`

Base branch: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

## Source Of Truth

MODEL-TIMEOUT-1 recorded `qwen_schema_timeout_calibrated_ready_for_model_dryrun` and selected `qwen3.7-plus`, `non_streaming`, `45000ms`, and `650` max output tokens as the Qwen target for the next synthetic dry-run.

The retry preserved the PR #318 synthetic dry-run approval packet, the PR #322 DashScope US endpoint/region repair pattern, and the MODEL-TIMEOUT-1 calibration evidence. Existing MODEL-DRYRUN-1A/1B evidence lives on separate model branches and is summarized in `docs/model-provider-dryrun-2-source-of-truth-read.md`.

## Execution

The guarded synthetic provider dry-run was executed exactly once with the required confirmations:

- `REEDITPRO_CONFIRM_MODEL_ORCHESTRATION_PROVIDER_DRY_RUN=true`
- `REEDITPRO_CONFIRM_QWEN_API_CALL=true`
- `REEDITPRO_CONFIRM_DEEPSEEK_API_CALL=true`
- `REEDITPRO_CONFIRM_PROVIDER_CALLS=true`
- `REEDITPRO_CONFIRM_SYNTHETIC_PROVIDER_PROMPTS_ONLY=true`
- `REEDITPRO_CONFIRM_SECRET_PAYLOAD_ACCESS_FOR_PROVIDER_DRY_RUN=true`
- `REEDITPRO_CONFIRM_RAW_PROMPT_BLOCKER_POLICY=true`
- `REEDITPRO_CONFIRM_PROVIDER_DRY_RUN_COST_GUARDRAILS=true`

Provider key/config environment payloads were absent before execution. Secret payloads were resolved only through the server-side Secret Manager path for the exact refs `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, `DASHSCOPE_REGION`, and `DEEPSEEK_API_KEY`.

DashScope base URL validation passed for the approved US endpoint. DashScope region validation passed for `us`.

## Provider Result

Qwen/DashScope: `passed`

DeepSeek: `passed`

Provider calls attempted: `7`

Qwen provider calls attempted: `4`

DeepSeek provider calls attempted: `3`

Qwen model used: `qwen3.7-plus`

Qwen mode: `non_streaming`

Qwen timeout: `45000ms`

Qwen max output tokens: `650`

`qwen3.7-max` used in MODEL-DRYRUN-2: `false`

## Blocker

The dry-run failed closed on the local cost/token guardrail:

- `totalTokensReported`: `7842`
- `maxTotalTokens`: `7200`
- active blocker: `provider_cost_or_token_guardrail_exceeded`

No repeat provider call was attempted after this blocker.

## Artifacts

Committed sanitized evidence:

- `docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json`
- `docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_comparison_report.json`
- `docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json`
- `docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json`
- `docs/model-provider-dryrun-2-source-of-truth-read.md`
- `docs/model-provider-dryrun-2-calibrated-target-review.md`
- `docs/model-provider-dryrun-2-results.md`

Private artifact upload: `not_attempted_provider_dry_run_not_passed`

Raw provider responses committed: `false`

Secret payloads printed or committed: `false`

## Supabase

Supabase update required: `docs/status only`

Supabase update status: `docs_only`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

## Validation

Local validation is recorded in `docs/model-provider-dryrun-2-results.md` and the final PR body.

## Next Step

Recommended next prompt: `MODEL-DRYRUN-2A - Calibrated Provider Dry-Run Fixes`.

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.
