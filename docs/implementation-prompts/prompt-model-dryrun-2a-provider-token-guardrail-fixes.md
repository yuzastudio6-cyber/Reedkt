# MODEL-DRYRUN-2A - Provider Token Guardrail Fixes

Branch: `codex/rp-model-dryrun-2a-provider-token-guardrail-fixes`

Base branch: `origin/codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run`

PR title: `[model] MODEL-DRYRUN-2A provider token guardrail fixes`

Pull request: pending.

Capability enabled: `none; MODEL-DRYRUN-2A provider token guardrail fixes only`

## Supplied Prompt Summary

Implement MODEL-DRYRUN-2A from a clean worktree. The fix targets only the token/cost guardrail failure from MODEL-DRYRUN-2, where Qwen and DeepSeek both passed schema validation but total reported tokens were `7842` over the `7200` cap.

Keep `maxTotalTokens=7200`, keep the seven approved synthetic cases, and add Qwen `enable_thinking: false` because current Qwen docs state that `max_tokens` does not limit chain-of-thought while `enable_thinking` controls hybrid thinking mode.

## Files Inspected

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
- official DashScope OpenAI-compatible and Qwen Chat API docs

## Implementation Notes

- Added `MODEL_DRY_RUN_QWEN_ENABLE_THINKING = false`.
- Added Qwen request body field `enable_thinking: false`.
- Added a static budget preflight script.
- Added MODEL-DRYRUN-2A diagnostics.
- Added MODEL-DRYRUN-2A source, diagnosis, budget, result, and summary docs.
- Updated present beta/blocker trackers only.
- Ran one guarded approved synthetic provider dry-run retry after static gates passed.
- Retry result: `provider_dry_run_passed`, total tokens `2871` of `7200`, private artifact upload `uploaded`.

## Base Gaps

These requested paths are absent on the MODEL-DRYRUN-2 base and were recorded as base gaps rather than fabricated: `PRODUCTION_FOUNDATION_STATUS.md`, `docs/source-of-truth-map.md`, `docs/production-milestone-plan.md`, `docs/implementation-prompts/README.md`, `docs/cross-chat/`, `docs/runtime-unlock/`, `.github/workflows/`, and `scripts/validation/run-foundation-validation.mjs`.

## No-Scope Statement

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.

## Validation Status

Local validation is in progress. PR link and CI status will be recorded after PR creation.
