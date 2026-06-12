# MODEL-DRYRUN-1 Qwen/DeepSeek Synthetic Provider Dry-Run Results

Status: `blocked`

Decision: `blocked_provider_call_failed`

Branch: `codex/rp-model-orchestration-qwen-deepseek-synthetic-provider-dry-run`

Base branch: `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval`

PR title: `[model] Qwen DeepSeek synthetic provider dry run`

PR: [#324](https://github.com/yuzastudio6-cyber/Reedkt/pull/324)

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

## MODEL-DRYRUN-1A Follow-Up

Status: `blocked_pending_dashscope_secret_rotation_by_owner`

MODEL-DRYRUN-1A performed a safe provider config review and metadata-only Secret Manager check. The latest enabled `DASHSCOPE_API_KEY` version observed was version `3`, created at `2026-06-12T15:55:42Z`, after the original failed run id `modeldryrun1-20260612T154825Z`.

Because that newer enabled version satisfied the retry gate, the approved synthetic provider dry-run was rerun with run id `modeldryrun1-20260612T161750Z`. Qwen/DashScope still failed closed with HTTP `401`, while DeepSeek passed again. No repo-side provider client fix was applied because the DashScope endpoint/auth/request shape matched current OpenAI-compatible guidance for the configured China-region endpoint.

Final MODEL-DRYRUN-1A decision: `blocked_pending_dashscope_secret_rotation_by_owner`.

## MODEL-DRYRUN-1B Follow-Up

Status: `blocked_pending_dashscope_secret_rotation_by_owner`

MODEL-DRYRUN-1B performed a source-of-truth read and metadata-only Secret Manager comparison for `DASHSCOPE_API_KEY`. The latest enabled DashScope version remained version `3`, created at `2026-06-12T15:55:42Z`, matching the MODEL-DRYRUN-1A metadata. Because no new enabled DashScope version was visible and the prompt itself was not treated as owner repair confirmation, no provider retry ran.

Final MODEL-DRYRUN-1B decision: `blocked_pending_dashscope_secret_rotation_by_owner`.

Recommended next prompt: `MODEL-DRYRUN-1C - DashScope Secret Repair Follow-Up` after owner-side DashScope secret/account/model-region repair produces a new safe enabled Secret Manager version.

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
- `docs/activation-model-provider-dry-run-reports/model_provider_dryrun_1a_gate_fix_summary.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dryrun_1b_owner_rotation_retry_summary.json`

## Base Gaps

- `scripts/validation/run-foundation-validation.mjs`: absent on this base branch; recorded as a base gap, not fabricated.
- `docs/implementation-prompts/README.md`: absent on this base branch; recorded as a base gap, not fabricated.
- `.github/workflows/`: absent on this base branch; recorded as a base gap, not fabricated.
- `PRODUCTION_FOUNDATION_STATUS.md`: absent on this base branch; recorded as a base gap, not fabricated.
- `docs/source-of-truth-map.md`: absent on this base branch; recorded as a base gap, not fabricated.
- `docs/production-milestone-plan.md`: absent on this base branch; recorded as a base gap, not fabricated.

## No-Scope Statement

No real user data, raw media, signed URLs, private URLs, provider chaining, tools, workers, routes, browser capture, map rendering, media processing, public artifacts, production, or external beta unlocks are allowed.
