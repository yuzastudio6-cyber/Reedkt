# Confirmed Runner

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED`

Decision: `completed_guarded_supabase_target_rls_storage_readonly_validation`

Execution: `completed_readonly_target_identity_and_advisor_validation_no_mutation`

Runner: `npm run rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed`

Required confirmation: `REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true`

Named Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Current run status: `completed_guarded_supabase_target_rls_storage_readonly_validation`

## Fail-Closed Behavior

If the confirmation is absent, the runner writes sanitized local evidence under `/tmp/reeditpro-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/<runId>/` and exits with blocker `blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation`.

If the confirmation is present but no complete approved credential context is present, the runner exits before any remote command with one of the shared credential-context blockers from `RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1`.

- `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`
- `blocked_missing_approved_supabase_access_token_alias`
- `blocked_missing_approved_supabase_readonly_db_url_alias`

The runner no longer performs target identity readback before the approved access-token alias and approved read-only DB URL alias are both present.

## Approved Credential Environment Aliases

Access-token aliases accepted by presence only:

- `SUPABASE_ACCESS_TOKEN`
- `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN`
- `REEDITPRO_SUPABASE_ACCESS_TOKEN`

Read-only DB URL aliases accepted by presence only:

- `REEDITPRO_SUPABASE_READONLY_DB_URL`
- `REEDITPRO_STAGING_SUPABASE_DB_URL`
- `SUPABASE_STAGING_DB_URL`
- `STAGING_SUPABASE_DB_URL`

The runner records only the selected environment variable name and boolean presence. It never writes, prints, or summarizes the access token or database URL payload.

## Allowed Confirmed Checks

- `supabase projects list --output json` for read-only target identity confirmation.
- `supabase db lint --db-url [redacted] --schema public,storage --level warning --fail-on none` for read-only advisor/RLS/storage-schema lint evidence.

The runner isolates `HOME` under the `/tmp` proof directory so Supabase CLI telemetry/profile state is not written to the user's home directory or the repository.

No secret payloads, access tokens, database URLs, service-role keys, anon keys, signed URLs, or private artifact paths may be written to reports.

## Confirmed Run Evidence

Run ID: `2026-06-26T14-39-42-178Z-ec258ac5`

Output directory: `/tmp/reeditpro-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/2026-06-26T14-39-42-178Z-ec258ac5`

Result: `completed_guarded_supabase_target_rls_storage_readonly_validation`

Target identity: `passed_readonly_management_api_project_list`

Advisor lint: `passed_readonly_public_storage_schema_lint`

Commands:

- `supabase projects list --output json`: `passed`
- `supabase db lint --db-url postgresql://[redacted] --schema public,storage --level warning --fail-on none`: `passed`

Credential context:

- Access-token alias: `SUPABASE_ACCESS_TOKEN`
- Read-only DB URL alias: `REEDITPRO_STAGING_SUPABASE_DB_URL`
- Service-role key: `false`
- Database password env var: `false`

The access-token and read-only DB URL secret payloads were read from Google Cloud Secret Manager only as an operator handoff into ephemeral process environment variables. They were not printed, committed, persisted in repo docs, or written to the sanitized runner report.
