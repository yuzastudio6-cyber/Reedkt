# Prompt MODEL-DRYRUN-1 - Qwen/DeepSeek Synthetic Provider Dry-Run

Implementation branch: `codex/rp-model-orchestration-qwen-deepseek-synthetic-provider-dry-run`

Base branch: `codex/rp-model-orchestration-qwen-deepseek-dry-run-approval`

Status: `blocked`

Decision: `blocked_provider_call_failed`

MODEL-DRYRUN-1A follow-up decision: `blocked_pending_dashscope_secret_rotation_by_owner`

Files inspected included `model-routing-policy.md`, `provider-prompt-architecture.md`, PR #318 approval reports, Qwen/DeepSeek audit reports, package scripts, activation CLIs, and existing smoke/report conventions.

Created package:

- Server module: `server/activation/model-orchestration-provider-dry-run/`.
- Reports: `docs/activation-model-provider-dry-run-reports/`.
- Results doc: `docs/activation-phase-model-provider-dry-run-results.md`.

MODEL-DRYRUN-1A follow-up:

- Safe DashScope provider config review completed.
- Secret Manager metadata-only review found a newer enabled `DASHSCOPE_API_KEY` version after the original failed run.
- Approved synthetic provider retry ran and still failed Qwen/DashScope with HTTP `401`.
- DeepSeek passed again.
- Final follow-up state is `blocked_pending_dashscope_secret_rotation_by_owner`.

Base gaps recorded:

- `scripts/validation/run-foundation-validation.mjs`
- `docs/implementation-prompts/README.md`

No-scope statement: No real user data, raw media, signed URLs, private URLs, provider chaining, tools, workers, routes, browser capture, map rendering, media processing, public artifacts, production, or external beta unlocks are allowed.
