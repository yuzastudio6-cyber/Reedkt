# MODEL-DRYRUN-1 Qwen/DeepSeek Synthetic Provider Dry-Run Results

Status: `blocked`

Decision: `blocked_provider_call_failed`

Branch: `codex/rp-model-orchestration-qwen-deepseek-synthetic-provider-dry-run`

Base branch: `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval`

PR title: `[model] Qwen DeepSeek synthetic provider dry run`

Production capability enabled: `none; Qwen/DeepSeek synthetic provider dry-run execution only`

## Scope

- Qwen model: `qwen3.7-plus`.
- DeepSeek model: `deepseek-v4-flash`.
- Escalation models used: `false`.
- Synthetic cases only: `true`.
- Secret payloads printed or committed: `false`.
- Raw provider responses committed: `false`.
- Private artifact prefixes, execute mode only: `gs://reeditpro-staging-reeditpro-generated-assets/activation-model-orchestration/model-dry-run-1` and `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-model-orchestration/model-dry-run-1`.

## Supabase Status

- Supabase update required: `optional approved milestone sync only`.
- Supabase update status: `docs_only`.
- Supabase environment touched: `none`.
- SQL executed: `none`.
- Migration deployed: `no`.

## Blockers

- `modeldryrun1_qwen_head_agent_planning:provider_http_error:401:Incorrect API key provided. For details, see: https://help.aliyun.com/zh/model-studio/error-code#apikey-error`

## Warnings

- None recorded.

## Reports

- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_source_audit.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_policy.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_synthetic_cases.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_request_redaction.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_secret_resolution.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_provider_results.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_normalized_responses.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_schema_validation.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_response_redaction.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_cost_usage.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_fail_closed.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_artifact_manifest.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_supabase_milestone_sync.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_qa_summary.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_readiness_report.json`

## Base Gaps

- `scripts/validation/run-foundation-validation.mjs`: absent on this base branch; recorded as a base gap, not fabricated.
- `docs/implementation-prompts/README.md`: absent on this base branch; recorded as a base gap, not fabricated.

## No-Scope Statement

No real user data, raw media, signed URLs, private URLs, provider chaining, tools, workers, routes, browser capture, map rendering, media processing, public artifacts, production, or external beta unlocks are allowed.
