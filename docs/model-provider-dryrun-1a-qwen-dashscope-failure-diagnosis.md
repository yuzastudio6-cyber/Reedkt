# MODEL-DRYRUN-1A Qwen/DashScope Failure Diagnosis

Status: `blocked_pending_dashscope_secret_rotation_by_owner`

Decision: `blocked_pending_dashscope_secret_rotation_by_owner`

Branch: `codex/rp-model-dryrun-1a-qwen-deepseek-dry-run-gate-fixes`

Base branch: `codex/rp-model-orchestration-qwen-deepseek-synthetic-provider-dry-run`

Production capability enabled: `none; MODEL-DRYRUN-1A Qwen/DeepSeek dry-run gate fixes only`

## Source Evidence

- MODEL-DRYRUN-1 committed report status: `blocked`.
- MODEL-DRYRUN-1 committed decision: `blocked_provider_call_failed`.
- Qwen/DashScope provider: `qwen_dashscope`.
- Qwen model: `qwen3.7-plus`.
- Qwen failure: provider HTTP `401` with sanitized class `Incorrect API key provided`.
- DeepSeek provider: `deepseek`.
- DeepSeek model: `deepseek-v4-flash`.
- DeepSeek status after retry: `passed`.
- Secret Manager payload resolution: `passed` for both refs without printing or committing payload values.
- Raw provider responses committed: `false`.

## Safe Metadata Review

Secret Manager metadata was reviewed without payload access:

- `DASHSCOPE_API_KEY` enabled versions observed: `3`.
- Latest enabled `DASHSCOPE_API_KEY` version observed: `3`.
- Latest enabled `DASHSCOPE_API_KEY` version create time: `2026-06-12T15:55:42Z`.
- Prior MODEL-DRYRUN-1 failed run id: `modeldryrun1-20260612T154825Z`.
- Retry run id: `modeldryrun1-20260612T161750Z`.
- `DEEPSEEK_API_KEY` enabled versions observed: `1`.

The latest enabled DashScope secret version was newer than the first failed run, so the approved retry gate was satisfied. The retry still failed closed with provider HTTP `401`, so the safe diagnosis is that the DashScope secret value, key region, provider account permission, or enabled model entitlement still needs owner-side repair.

## Repo-Side Config Review Summary

The Qwen client already uses the China-region OpenAI-compatible DashScope endpoint shape:

- URL: `https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`.
- Auth header: `Authorization: Bearer <redacted>`.
- Content type: `application/json`.
- Request body includes model, messages, `max_tokens`, `temperature`, `stream: false`, and JSON response format.

Current Alibaba Cloud Model Studio documentation says the OpenAI-compatible endpoint uses region-specific base URLs and Bearer API-key authentication. It also states API keys and base URLs are not interchangeable across Singapore, US, and China regions. Because the repo is using a valid China-region endpoint shape and the provider response is an auth error after the latest enabled secret version, no repo-side code fix was applied.

## Result

- Fix applied: `no_repo_side_fix_available`.
- Provider retry executed: `yes`.
- Qwen retry status: `blocked_http_401`.
- DeepSeek retry status: `passed`.
- Private artifact upload: `not_attempted_provider_gate_blocked`.
- Supabase milestone sync: `not_attempted_provider_gate_blocked`.
- Final state: `blocked_pending_dashscope_secret_rotation_by_owner`.

## Next Step

Recommended next prompt: `MODEL-DRYRUN-1B - Provider Dry-Run Retry` after the owner rotates or repairs the DashScope API key/account/model-region entitlement in Secret Manager.

## No-Scope Statement

No worker execution, tool execution, route execution, raw prompt execution, broad provider runtime, media processing, browser capture, Docker/Cloud Run execution, Supabase mutation, SQL execution, storage transfer, signed URL creation, public artifact creation, production deployment, external beta unlock, paid production unlock, Google Cloud Secret Manager payload exposure, secret commit, raw provider response commit, broad service-role handler, or production/beta unlock was enabled.
