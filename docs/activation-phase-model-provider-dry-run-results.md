# MODEL-DRYRUN-1 Qwen/DeepSeek Full Synthetic Provider Dry-Run Results

Status: `completed`

Run ID: `modeldryrun1-20260612T174538`

Branch: `codex/rp-model-orchestration-qwen-deepseek-full-synthetic-provider-dry-run`

Base: `codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

PR title: `[model] Qwen DeepSeek full synthetic provider dry run`

## Execution

Guarded full synthetic provider dry-run completed in staging with provider and Supabase payload environment variables explicitly unset. Provider secret payload resolution used Google Secret Manager only for the exact refs `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, `DASHSCOPE_REGION`, and `DEEPSEEK_API_KEY`.

Decision: `provider_dry_run_passed_ready_for_plan_snapshot_contract`

Plan snapshot contract readiness: `true`

Supabase milestone sync: `not_attempted_current_branch_missing_sync_layer`

## Source Evidence

PR #318 dry-run approval decision: `approved_for_future_qwen_deepseek_provider_dry_run`

PR #330 Qwen timeout calibration run: `qwentimeout1-20260612T165931`

Qwen timeout calibration decision: `qwen_schema_timeout_calibrated_ready_for_model_dryrun`

Qwen default target: `qwen3.7-plus`

Qwen timeout: `45000ms`

Qwen max output tokens: `650`

DeepSeek default target: `deepseek-v4-flash`

Escalation models were policy-only and were not called.

## Provider Results

Qwen/DashScope:
- Model: `qwen3.7-plus`
- Case: `modeldryrun1_qwen_head_agent_plan_snapshot`
- Schema: `plan_snapshot_candidate_v1`
- HTTP status: `200`
- Latency: `29016ms`
- Usage: `1867` total tokens reported
- Result: `passed`

DeepSeek:
- Model: `deepseek-v4-flash`
- Case: `modeldryrun1_deepseek_coding_spec_proposal`
- Schema: `agent_findings_v1`
- HTTP status: `200`
- Latency: `1553ms`
- Usage: `582` total tokens reported
- Result: `passed`

Cost guardrail: `passed_by_call_and_token_caps`

Total provider calls: `2`

Total reported tokens: `2449`

## Safety And Redaction

Secret payloads printed or committed: `false`

DashScope base URL and region payloads stored: `false`

Raw provider responses stored or printed: `false`

Raw prompt payloads stored: `false`

Schema validation: `passed`

Redaction validation: `passed`

Fail-closed invalid JSON fixture: `passed`

Tools, workers, routes, provider chaining, browser capture, map rendering, media processing, SQL, migrations, schema/RLS changes, raw prompt execution, public artifacts, signed URLs, production, external beta, and paid production remain blocked.

## Artifacts

Generated artifacts:

`gs://reeditpro-staging-reeditpro-generated-assets/activation-model-orchestration/model-dry-run-1/modeldryrun1-20260612T174538/`

QA artifacts:

`gs://reeditpro-staging-reeditpro-qa-artifacts/activation-model-orchestration/model-dry-run-1/modeldryrun1-20260612T174538/`

Uploaded generated artifacts:
- `audit/repo-ownership-audit.json`
- `policy/model-provider-dry-run-policy.json`
- `cases/synthetic-dry-run-cases.json`
- `requests/sanitized-provider-request-metadata.json`
- `responses/normalized-provider-responses.json`
- `validation/schema-validation-results.json`
- `validation/redaction-validation-results.json`
- `cost/provider-cost-usage-summary.json`
- `manifest/model-provider-dry-run-manifest.json`

Uploaded QA artifacts:
- `qa/model-provider-dry-run-qa.json`
- `reports/model-provider-dry-run-report.json`

## Supabase

Supabase update required: `no`

Supabase update status: `not_attempted_current_branch_missing_sync_layer`

Supabase environment touched: `none`

SQL executed: `none`

Migration deployed: `no`

Schema/RLS changes: `none`

Unrelated rows written: `false`

## Validation

Passed:
- `npm run smoke:activation-model-provider-dry-run`
- `npm run activation:model-provider-dry-run:report`
- `npm run activation:model-provider-dry-run:iam-plan`
- `npm run activation:model-provider-dry-run:summary`
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

Production readiness summary remains `blocked`.

External beta remains `false`.

Package lock: `unchanged`

## Next Step

MODEL-DRYRUN-1 is ready for the plan snapshot contract follow-up. The current branch does not include the approved Supabase milestone sync layer, so no Supabase milestone write was attempted and no Supabase action is required for this phase.
