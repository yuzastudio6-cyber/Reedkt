# RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1-CONFIRMED-RUN

Run only after `RP-EXTERNAL-BETA-QWEN-NATIVE-API-AUTH-CONTEXT-BRIDGE-1` is merged and deployed to staging with Supabase public auth env configured.

Required runtime inputs:

- A valid external-beta tester Supabase user JWT supplied as a bearer token to the native staging API route.
- `SUPABASE_URL` or `VITE_SUPABASE_URL` configured on the staging API service.
- `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY` configured on the staging API service.
- Existing QWEN runtime gates remain required.

Scope:

- Bounded approved-snapshot structured metadata fixture only.
- No arbitrary user media.
- No public artifacts.
- No production unlock.
- Restore fail-closed Cloud Run service/job settings after any confirmed runtime fixture.
- Commit only sanitized report/manifest/checksum summaries, never `/tmp` artifacts.
