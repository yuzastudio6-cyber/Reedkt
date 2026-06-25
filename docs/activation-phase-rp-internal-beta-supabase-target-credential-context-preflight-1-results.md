# RP-INTERNAL-BETA-SUPABASE-TARGET-CREDENTIAL-CONTEXT-PREFLIGHT-1 Results

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-CREDENTIAL-CONTEXT-PREFLIGHT-1`

Decision: `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`

Execution: `blocked_no_remote_execution_missing_safe_credential_context`

Named Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Approved access-token aliases: `SUPABASE_ACCESS_TOKEN`, `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN`, `REEDITPRO_SUPABASE_ACCESS_TOKEN`.

Approved read-only DB URL aliases: `REEDITPRO_SUPABASE_READONLY_DB_URL`, `REEDITPRO_STAGING_SUPABASE_DB_URL`, `SUPABASE_STAGING_DB_URL`, `STAGING_SUPABASE_DB_URL`, `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`.

Runner: `npm run rp-internal-beta-supabase-target-credential-context-preflight-1`

Diagnostics: `npm run --silent rp-internal-beta-supabase-target-credential-context-preflight-1:diagnostics`

Commands executed by preflight: `none`

Credential payloads printed: `false`

Credential payloads persisted: `false`

Remote Supabase command: `false`

Remote Supabase mutation: `false`

SQL execution: `false`

Migration apply: `false`

Storage object read: `false`

Service-role secret payload access: `false`

Frontend service-role credential exposure: `false`

Internal beta unlock: `false`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`

## Local Preflight Evidence

Run ID: `2026-06-25T21-34-44-419Z-47da279b`

Output directory: `/tmp/reeditpro-rp-internal-beta-supabase-target-credential-context-preflight-1/2026-06-25T21-34-44-419Z-47da279b`

Result: `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`

Artifacts/checksums:

- `credential-context-preflight-report.json`, `2302` bytes, SHA-256 `6424c7fc440ecd921b92685ebebb53f7853ff436db2502804b1bee96262e43da`
- `artifact-manifest.json`, `677` bytes, SHA-256 `b1e61a33769acb196b05985c096aabaabda9ae45f8548e0c493dc0ca67c992d5`

Generated `/tmp` artifacts committed: `none`

Next recommended milestone: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN`

No remote Supabase command, remote Supabase mutation, SQL execution, SQL mutation, migration apply, RLS policy apply, storage bucket creation, storage object creation, storage object read, service-role secret payload access, frontend service-role credential exposure, service-role route execution, Google Cloud API call, Cloud Run service creation, Cloud Run job creation, Cloud Run deployment, IAM mutation, GCS bucket creation, GCS object access, provider call, model call, raw prompt execution, worker execution, worker dispatch, worker lease claim, route execution, browser capture, Remotion execution, FFmpeg execution, FFprobe execution, media processing, signed URL creation, public artifact creation, credit mutation, credit reservation creation, credit spend, job enqueue, job event write, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, final render/export, preview artifact creation, private media processing, user media processing, package installation beyond dependency validation, dependency mutation, package-lock mutation, Dockerfile change, requirements change, or broad service-role handler was enabled.
