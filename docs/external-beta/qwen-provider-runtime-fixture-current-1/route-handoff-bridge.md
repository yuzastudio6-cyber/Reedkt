# Native Route Backend Handoff Bridge

Route: `POST /api/providers/qwen2-5-vl/structured-visual-metadata`

Native deployed source: `src/server/server-router.ts`

Default behavior: `fail_closed_http_424`

Confirmed behavior: `backend_only_handoff_contract_selected_but_blocked_without_verified_user_context`

The route now uses the existing `createQwen25VlExternalBetaProductRouteHandlerSource` contract in two modes:

- Default, no confirmation: `buildBlockedResult(routeInput)`.
- Explicit backend handoff confirmation: `buildBackendJobHandoff(routeInput)`.

The confirmed handoff still requires the existing readback/runtime gates:

- `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_BACKEND_JOB_HANDOFF=true`
- `REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`

When all gates are present, the native route selects the backend handoff contract. In the current deployed native router, that contract remains blocked because no verified application user context is available. The route does not execute the provider, model, worker, Cloud Run job, Supabase, SQL, media processing, signed URL, public artifact, credit mutation, final export, external beta unlock, or production unlock path.

Blocker: `blocked_native_staging_api_missing_verified_user_context_for_backend_handoff`

Next milestone: `RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1`
