# RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1

Goal: add a verified application user context path for the native staging API route before any QWEN product-route backend handoff can be treated as ready.

Starting point: `RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1` recorded that the native route can select the backend handoff contract under explicit gates, but remains blocked with `blocked_native_staging_api_missing_verified_user_context_for_backend_handoff`.

Required boundaries:

- Do not accept arbitrary spoofable user headers as production auth.
- Prefer verified Supabase user JWT validation or another repo-approved application-auth source.
- Preserve Cloud Run IAM as an outer staging access control only.
- Do not run provider/model inference.
- Do not dispatch workers.
- Do not mutate Supabase or run SQL unless a later explicit guarded persistence packet authorizes it.
- Do not create signed/public artifacts, process media, unlock beta/production, or run final export.

Acceptance:

- Native API route remains fail-closed by default.
- Confirmed route handoff can include a verified `authenticatedUserRef`.
- Backend-only handoff returns HTTP `202` only when handoff/readback/runtime gates and verified user context are present.
- Missing or invalid auth remains blocked before provider/model/runtime execution.
