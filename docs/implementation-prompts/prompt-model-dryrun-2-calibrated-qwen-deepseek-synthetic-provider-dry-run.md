# MODEL-DRYRUN-2 - Calibrated Qwen/DeepSeek Synthetic Provider Dry-Run Retry

Branch: `codex/rp-model-dryrun-2-calibrated-qwen-deepseek-synthetic-provider-dry-run`

Base branch: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

PR title: `[model] MODEL-DRYRUN-2 calibrated Qwen DeepSeek synthetic provider dry run`

Pull request: https://github.com/yuzastudio6-cyber/Reedkt/pull/333

Capability enabled: `none; calibrated Qwen/DeepSeek synthetic provider dry-run retry only`

## Supplied Prompt Summary

Implement MODEL-DRYRUN-2 from a clean sibling worktree and retry only the approved synthetic provider dry-run after MODEL-TIMEOUT-1. The Qwen/DashScope target must use `qwen3.7-plus`, `non_streaming`, timeout `45000ms`, max output tokens `650`, and `stream: false`. DeepSeek remains the existing approved synthetic control path.

The implementation must load `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`, `DASHSCOPE_REGION`, and `DEEPSEEK_API_KEY` only from Google Cloud Secret Manager inside the guarded server-side execution path. DashScope base URL and region must validate against the repaired US endpoint/region before Qwen calls. `qwen3.7-max` is not used in MODEL-DRYRUN-2.

## Files Inspected

- `model-routing-policy.md`
- `provider-prompt-architecture.md`
- `docs/activation-qwen-timeout-calibration-reports/readiness/qwen-timeout-calibration-readiness-report.json`
- `docs/activation-qwen-timeout-calibration-reports/recommendation/qwen-model-timeout-target-recommendation.json`
- `docs/activation-model-orchestration-provider-dry-run-reports/provider_dry_run_plan.json`
- `server/activation/model-orchestration-provider-dry-run/index.ts`
- `server/activation/model-orchestration-qwen-auth-repair/index.ts`
- remote branch evidence names for MODEL-DRYRUN-1A and MODEL-DRYRUN-1B

## Implementation Notes

- Added MODEL-DRYRUN-2 summary reporting in `docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json`.
- Added `model-provider:dryrun-2:diagnostics`.
- Updated the provider dry-run runner to validate DashScope base URL and region from Secret Manager before Qwen calls.
- Applied the MODEL-TIMEOUT-1 Qwen calibration to Qwen cases only.
- Kept DeepSeek as the existing approved synthetic control path.
- Restricted private artifact upload to full provider dry-run pass outcomes.

## Base Gaps

These requested tracker/foundation paths are absent on the timeout-calibration base and were recorded as base gaps rather than fabricated: `PRODUCTION_FOUNDATION_STATUS.md`, `docs/source-of-truth-map.md`, `docs/production-milestone-plan.md`, `docs/implementation-prompts/README.md`, `docs/cross-chat/`, `docs/runtime-unlock/`, `.github/workflows/`, and `scripts/validation/run-foundation-validation.mjs`.

## No-Scope Statement

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.

## Validation Status

Local validation and PR/CI status are recorded in `docs/model-provider-dryrun-2-results.md` and `docs/activation-model-orchestration-provider-dry-run-reports/model_provider_dryrun_2_summary.json` after the guarded run.

Recommended next prompt: `PLAN-SNAPSHOT-0 - Plan Snapshot Contract` if the calibrated provider dry-run passes; otherwise `MODEL-DRYRUN-2A - Calibrated Provider Dry-Run Fixes`.
