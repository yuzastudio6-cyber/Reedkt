# Qwen Provider Config Audit

RP-QWEN-00 audits the provider-config layer for future Qwen runtime work. The source of truth is `src/backend/provider-config/*` and `src/types/provider-config.ts`.

Common audit boundary: Qwen 3.7 Max, Marker Chat, Secret Manager, backend-only, structured response, fallback, owner approval pending, no Qwen call, no provider call, no secret values inspected, no gcloud command, no runtime implementation.

## Existing Provider Config

- `QWEN_API_KEY` is registered as a required production secret with `secret_manager_only` boundary.
- `QWEN_BASE_URL` and `QWEN_MODEL_ID` are optional backend-only configuration names.
- Qwen runtime is registered as `reasoning_model`, backend-only, disabled by default, and blocked by provider enablement, secret presence, rate-limit, and manual-review gates.
- Frontend public config is limited to public runtime mode/API/Supabase metadata and never includes Qwen secret names as usable values.

## Reuse Plan

Reuse provider secret registry, runtime registry, readiness checks, inventory redaction, frontend secret safety validation, and provider-config smoke coverage. Future runtime code must consume a readiness result before transport creation.

## Gaps

- No Qwen production config approval exists.
- No Secret Manager runtime resolver exists.
- No provider SDK/client or HTTP transport is allowed in RP-QWEN-00.
- Provider readiness remains blocked for real production execution.
