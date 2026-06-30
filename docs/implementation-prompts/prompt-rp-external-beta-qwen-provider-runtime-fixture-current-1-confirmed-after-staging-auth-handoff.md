# RP-EXTERNAL-BETA-QWEN-PROVIDER-RUNTIME-FIXTURE-CURRENT-1-CONFIRMED-RUN

Run only after `RP-EXTERNAL-BETA-QWEN-NATIVE-AUTH-BRIDGE-STAGING-HANDOFF-PREFLIGHT-1` is merged.

Source prerequisites now satisfied:

- Native staging API auth bridge merged at `3618372ee2c16955d9d3b0d90df260488b2fd6e6`.
- Staging API revision `reeditpro-staging-api-00011-79q` serves the auth bridge image.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are configured as public auth secrets on the staging API.
- `X-Serverless-Authorization` is the Cloud Run IAM header; `Authorization` remains the Supabase user JWT header.
- Confirmed backend-only handoff preflight passed with run ID `2026-06-30T08-14-05-042Z-ced056a2`.

The next runtime fixture must remain bounded to the approved structured metadata fixture. It must not use arbitrary user media, public artifacts, production resources, or final render/export. Restore fail-closed route/provider settings after the run.
