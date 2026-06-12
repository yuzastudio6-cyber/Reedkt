# MODEL-DRYRUN-2A Source Of Truth Read

Status: `blocked_pending_execute_retry`.

Branch: `codex/rp-model-dryrun-2a-provider-token-guardrail-fixes`.

Base branch: `origin/codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run`.

PR title: `[model] MODEL-DRYRUN-2A provider token guardrail fixes`.

## Sources Read

- `model-routing-policy.md`
- `provider-prompt-architecture.md`
- `docs/model-provider-dryrun-2-source-of-truth-read.md`
- `docs/model-provider-dryrun-2-calibrated-target-review.md`
- `docs/model-provider-dryrun-2-results.md`
- `docs/activation-phase-model-provider-dry-run-results.md`
- `docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json`
- `docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_comparison_report.json`
- `docs/activation-model-orchestration-provider-dry-run-reports/qwen_provider_dry_run_report.json`
- `docs/activation-model-orchestration-provider-dry-run-reports/deepseek_provider_dry_run_report.json`
- `server/activation/model-orchestration-provider-dry-run/index.ts`
- `scripts/validation/model-provider-dryrun-2-diagnostics.mjs`

Official docs basis:

- https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope
- https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions

The official DashScope OpenAI-compatible documentation keeps the US endpoint at `https://dashscope-us.aliyuncs.com/compatible-mode/v1` and calls out regional API key behavior. The Qwen OpenAI Chat API documentation states that `max_tokens` controls response length but does not limit chain-of-thought, and documents `enable_thinking` as the switch for hybrid thinking mode.

## MODEL-DRYRUN-2 Evidence

MODEL-DRYRUN-2 executed one approved synthetic provider retry and failed closed only after provider success:

- final state: `blocked_provider_call_failed`
- internal decision: `blocked_pending_cost_review`
- active blocker: `provider_cost_or_token_guardrail_exceeded`
- Qwen/DashScope status: `passed`
- DeepSeek status: `passed`
- provider calls attempted: `7`
- total tokens reported: `7842`
- max total tokens: `7200`
- raw provider responses committed: `false`
- secret payloads printed or committed: `false`

## Base Gaps

These requested broad tracker/foundation paths are absent on the MODEL-DRYRUN-2 base and are recorded as base gaps rather than fabricated: `PRODUCTION_FOUNDATION_STATUS.md`, `docs/source-of-truth-map.md`, `docs/production-milestone-plan.md`, `docs/implementation-prompts/README.md`, `docs/cross-chat/`, `docs/runtime-unlock/`, `.github/workflows/`, and `scripts/validation/run-foundation-validation.mjs`.

## Scope

MODEL-DRYRUN-2A may only fix the token guardrail path for the already-approved synthetic provider dry-run. It does not change provider approval scope, case count, DeepSeek control behavior, Supabase status, worker/tool/route behavior, or beta/production state.

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.
