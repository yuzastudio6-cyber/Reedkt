# RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1 Source Audit

Packet: `RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1`

Decision: `completed_qwen_native_api_auth_context_bridge_ready_for_confirmed_route_handoff_runtime_fixture`

Execution: `completed_verified_native_api_auth_context_source_bridge_no_provider_execution`

Source base: `c334097c061b05b9413b131883871f5c4f5fd649`

PR #1787 closed the native route-selection gap and recorded the blocker `blocked_native_staging_api_missing_verified_user_context_for_backend_handoff`. This packet closes that source blocker by adding a verified auth context path to the native staging API route.

Normal runtime auth source:

- `Authorization: Bearer <Supabase user JWT>`
- Verification: `createSupabasePublicClient(env).auth.getUser(token)`
- Required env for live staging verification: `SUPABASE_URL` or `VITE_SUPABASE_URL`, plus `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`
- Service-role secret usage: `false`

Local smoke validation source:

- `REEDITPRO_CONFIRM_QWEN_NATIVE_API_AUTH_CONTEXT_LOCAL_VALIDATION=true`
- `REEDITPRO_ROUTE_VALIDATION_AUTH_USER_ID=<uuid>`
- This local path is for source smoke only and is not a production auth substitute.

The bridge does not accept arbitrary user headers as auth. Cloud Run IAM remains an outer staging access control only; application auth still requires Supabase JWT verification for real runtime use.

#577 remains open/draft/blocked/conflicting and excluded.

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
