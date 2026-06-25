# Confirmed Runner Credential Context Hardening

The confirmed runner `scripts/validation/rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed.mjs` now evaluates the complete approved credential context before any remote command can run.

Decision: `completed_confirmed_runner_credential_context_hardening_fail_closed`

Execution: `completed_local_runner_hardening_no_remote_execution`

Current run status: `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`

Required confirmation remains `REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true`.

The confirmation gate alone is not enough. After confirmation, the runner requires both:

- one approved access-token alias: `SUPABASE_ACCESS_TOKEN`, `REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN`, or `REEDITPRO_SUPABASE_ACCESS_TOKEN`;
- one approved read-only DB URL alias: `REEDITPRO_SUPABASE_READONLY_DB_URL`, `REEDITPRO_STAGING_SUPABASE_DB_URL`, `SUPABASE_STAGING_DB_URL`, `STAGING_SUPABASE_DB_URL`, or `REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL`.

If either side is missing, the runner exits before remote command execution with one of the shared credential-context blockers:

- `blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias`
- `blocked_missing_approved_supabase_access_token_alias`
- `blocked_missing_approved_supabase_readonly_db_url_alias`

Remote target identity readback and read-only RLS/storage advisor lint remain blocked until the credential context is complete.
