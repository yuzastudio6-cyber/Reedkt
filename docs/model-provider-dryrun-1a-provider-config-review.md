# MODEL-DRYRUN-1A Provider Config Review

Status: `provider_config_review_completed_no_repo_fix`

## Required Inputs Reviewed

- `model-routing-policy.md`
- `provider-prompt-architecture.md`
- `server/activation/model-orchestration-provider-dry-run/qwen-dry-run-client.ts`
- `server/activation/model-orchestration-provider-dry-run/deepseek-dry-run-client.ts`
- `server/activation/model-orchestration-provider-dry-run/provider-fail-closed-runner.ts`
- `server/activation/model-orchestration-provider-dry-run/provider-secret-resolver.ts`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_provider_results.json`
- `docs/activation-model-provider-dry-run-reports/model_provider_dry_run_secret_resolution.json`

## Qwen/DashScope Config

The repo-side Qwen client uses an OpenAI-compatible DashScope request:

- Provider id: `qwen_dashscope`.
- Model id: `qwen3.7-plus`.
- Endpoint: China-region compatible-mode chat completions.
- Auth mode: Bearer token from `DASHSCOPE_API_KEY`.
- Secret source: Google Secret Manager only.
- Payload logging: `false`.
- Payload commit: `false`.
- Raw provider response commit: `false`.

Alibaba Cloud documentation reviewed during MODEL-DRYRUN-1A confirms that OpenAI-compatible Qwen calls use region-specific compatible-mode endpoints and Bearer API-key authentication. It also warns that Singapore, US, and China API keys/base URLs are region-specific and not interchangeable. The repo request shape matches the China-region endpoint currently configured.

## DeepSeek Config

The DeepSeek client is unchanged in MODEL-DRYRUN-1A. It passed the approved synthetic coding/spec proposal case in the retry run and continues to write only sanitized committed metadata.

## Fix Decision

No code change was made to the provider clients because implementation-time review did not identify a narrow request-shape bug. The latest enabled `DASHSCOPE_API_KEY` Secret Manager version was attempted and still returned provider HTTP `401`, so the remaining blocker is owner-side DashScope secret/account/model-region repair.

## Safety Decision

- Provider chaining enabled: `false`.
- Non-synthetic prompts used: `false`.
- Workers/tools/routes executed: `false`.
- Supabase mutation: `false`.
- SQL executed: `none`.
- Secret payload exposed or committed: `false`.
- Raw provider response committed: `false`.

No additional provider retries should run until a new owner-side DashScope secret/account repair is recorded.
