# Qwen Live Beta Activation

RP-QWEN-BETA-02 adds a backend-only live beta path for Qwen 3.7 Marker Chat. Production ready: false.

Activation requires:
- `REEDITPRO_QWEN_RUNTIME_MODE=beta_enabled`.
- Google Cloud project config for Secret Manager.
- `QWEN_REASONING_API_KEY_SECRET`.
- Qwen endpoint from backend config or Secret Manager, plus a backend model ID. Current owner-machine verification uses `qwen3.7-plus`.
- `npm run doctor:qwen-beta` returning `ready_live_beta`.

## Exact Unlock Gates

Set these on the backend/server process only. Do not put API keys in frontend env vars.

| Gate | Accepted env/config | Current blocked symptom when absent |
| --- | --- | --- |
| Runtime mode | `REEDITPRO_QWEN_RUNTIME_MODE=beta_enabled` | `blocked_runtime_disabled` |
| Google project identity | `GOOGLE_CLOUD_PROJECT_ID`, `GCLOUD_PROJECT`, or `GOOGLE_CLOUD_PROJECT` | `blocked_missing_project_config` |
| API key secret reference | `QWEN_REASONING_API_KEY_SECRET` as a secret id or `projects/<project>/secrets/<name>` reference | `blocked_missing_secret_reference` or `blocked_secret_access_denied` |
| Provider base URL | backend config `QWEN_REASONING_BASE_URL` or Secret Manager reference `QWEN_REASONING_BASE_URL_SECRET` | `blocked_missing_endpoint` |
| Provider model id | backend config `QWEN_REASONING_MODEL_ID` or Secret Manager reference `QWEN_REASONING_MODEL_ID_SECRET` | `blocked_missing_model_id` |
| Transport profile | optional `QWEN_REASONING_TRANSPORT_PROFILE`, default `openai_chat_completions`; also supports `generic_json_post` | transport stays default when absent |
| Request path | optional `QWEN_REASONING_REQUEST_PATH`, default comes from the transport profile | `requestPathConfigured: false` is acceptable when default profile path is intended |
| Timeout/retry | optional `QWEN_REASONING_TIMEOUT_MS`, `QWEN_REASONING_MAX_RETRIES` | defaults are used when absent |

For browser live Marker Chat testing, the frontend must point at the backend beta route without receiving secrets:

| Browser setting | Value |
| --- | --- |
| `VITE_REEDITPRO_QWEN_MARKER_CHAT_LIVE` | `true` |
| `VITE_REEDITPRO_API_BASE_URL` or `VITE_API_BASE_URL` | the running backend API base URL |

## Safe Unlock Order

1. Configure backend runtime env and Secret Manager access outside the repo. Do not commit `.env` files or secret values.
2. Run `npm run unlock:qwen-beta` to verify the local env presence checklist. This command does not call Qwen, Secret Manager, `gcloud`, Supabase, workers, render, or credits.
3. Run `npm run unlock:qwen-beta:example` when you need placeholder export lines. Replace placeholders outside git-tracked files and never commit secrets.
4. Run `npm run unlock:qwen-beta:strict` in CI or owner handoff scripts when missing gates should fail fast.
5. Run `npm run doctor:qwen-beta`.
6. Continue only if the doctor returns `ready_live_beta`.
7. Run `npm run smoke:qwen-live-provider`.
8. Run `npm run smoke:qwen-marker-chat-live`.
9. On an owner machine with compatible Secret Manager refs, run `npm run smoke:qwen-live-owner-config` to verify doctor, provider, and Marker Chat route together without printing secret names or values.
10. Run `PLAYWRIGHT_QWEN_LIVE=true PLAYWRIGHT_PORT=<fresh> npx playwright test tests/e2e/project-edit-brief-marker-chat-live.spec.ts` with the backend API server running and frontend live Marker Chat env set.

Fallback success does not unlock live Qwen. Live success requires `providerCallMade: true`, `qwenCallMade: true`, `runtimeSource: qwen_live`, `fallbackUsed: false`, structured response validation, and no secret/frontend/provider payload leakage.

Current owner-machine evidence: `npm run smoke:qwen-live-owner-config` passes with `qwen3.7-plus`, `doctor:qwen-beta` ready, live provider validation, live Marker Chat route persistence, idempotency replay, no fallback, and all secret/Supabase/render/credit flags safe.

The browser never receives provider keys, Secret Manager values, Authorization headers, service-account data, raw provider payloads, or hidden reasoning. If the doctor is blocked, status is `blocked_live_beta_configuration`; deterministic fallback remains available but does not count as live verification.

No Supabase command, migration, render, worker, media processing, upload, URL fetch, file-byte read, credit action, staging, commit, or cleanup is part of this activation.

## RP-MEDIA-01 Activation Boundary

Browser-local source video preview does not alter live beta activation. Live Qwen Marker Chat still depends only on backend beta gates and must not receive source video object URLs, browser file handles, raw media bytes, uploaded media, worker commands, render/export payloads, or credit actions. Source video context remains future gated after durable media and Qwen2.5-VL adapter decisions.

## Qwen2.5-VL Visual Context Beta

RP-QWENVL-BETA-01 uses separate runtime gates and browser opt-in: `REEDITPRO_QWEN25VL_RUNTIME_MODE`, `QWEN25VL_API_KEY_SECRET`, `QWEN25VL_BASE_URL(_SECRET)`, `QWEN25VL_MODEL_ID(_SECRET)`, and `VITE_REEDITPRO_QWEN25VL_VISUAL_CONTEXT_LIVE`. This path is for marker visual context from sampled resized frames only. It does not change Qwen 3.7 Marker Chat activation and does not authorize full-video upload, raw frame persistence, workers, render/export, credits, Supabase CLI, or migrations.
