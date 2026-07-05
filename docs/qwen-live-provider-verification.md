# Qwen Live Provider Verification

`npm run smoke:qwen-live-provider` performs one harmless backend-only Qwen 3.7 Max provider call when live beta config is ready.

Required success evidence:
- `runtimeSource: qwen_live`.
- `providerCallMade: true` and `qwenCallMade: true`.
- `fallbackUsed: false`.
- Structured response validation passes before persistence.
- Secret values are not printed or sent to frontend.
- No worker, render, planner, media, Supabase, or credit effect occurs.

Blocked categories are reported without leaking secrets: `blocked_live_beta_configuration`, `secret_resolution_failed`, `provider_auth_failed`, `endpoint_unreachable`, `model_not_available`, `provider_timeout`, `provider_rate_limited`, `invalid_provider_response`, or `structured_validation_failed`.

## Verification - 2026-06-26

- Local owner-config live smoke passed with model label `qwen3.7-plus`: `doctor:qwen-beta`, `smoke:qwen-live-provider`, and `smoke:qwen-marker-chat-live`.
- Deployed Cloud Run route passed via `GOOGLE_CLOUD_PROJECT_ID=reeditpro npm run check:production-qwen-live-route`.
- Current deployed service evidence: `reeditpro-api` revision `reeditpro-api-00024-xgs`, image `public-beta-20260626-prodserver-06`, Cloud Build `295c7833-cc99-42c5-827f-14ff0263c162`.
- Authenticated readiness reported `ready_live_beta`.
- Marker Chat response used `runtimeSource: qwen_live`, `fallbackUsed: false`, `providerCallMade: true`, and `qwenCallMade: true`.
- Durable idempotency replay returned without a second provider call.
- Monitoring gates and rollback drill passed after this image was deployed.
- Secret values, Authorization headers, raw provider payloads, hidden reasoning, render jobs, worker jobs, and credit activity were not exposed or started.
