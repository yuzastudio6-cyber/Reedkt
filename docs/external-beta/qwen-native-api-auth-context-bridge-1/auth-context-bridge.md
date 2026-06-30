# Native API Auth Context Bridge

Route: `POST /api/providers/qwen2-5-vl/structured-visual-metadata`

Native source: `src/server/server-router.ts`

Auth bridge status: `implemented_source_verified_bearer_token_path`

Behavior:

- No backend handoff confirmation: route remains fail-closed HTTP `424`.
- Backend handoff confirmation without bearer token: route returns HTTP `401` with `blocked_missing_authorization_bearer_token`.
- Backend handoff confirmation with unavailable Supabase public client: route returns HTTP `401` with `blocked_supabase_public_auth_client_unavailable`.
- Backend handoff confirmation with invalid bearer token: route returns HTTP `401` with `blocked_authorization_bearer_token_verification_failed`.
- Backend handoff confirmation with verified auth context and readback/runtime gates: route returns the backend-only handoff contract response.

The handoff response remains source-only:

- Provider/model execution: `false`
- Worker dispatch: `false`
- Cloud Run job execution: `false`
- Supabase mutation: `false`
- SQL execution: `false`
- Signed/public artifacts: `false`
- Final render/export: `false`
- External beta unlock: `false`
- Production unlock: `false`

Next milestone: `RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1-CONFIRMED-RUN`
