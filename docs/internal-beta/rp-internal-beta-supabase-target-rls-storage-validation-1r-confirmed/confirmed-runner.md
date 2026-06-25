# Confirmed Runner

Packet: `RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED`

Decision: `completed_guarded_confirmed_validation_runner_fail_closed_without_remote_execution`

Execution: `completed_runner_scaffold_no_remote_execution`

Runner: `npm run rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed`

Required confirmation: `REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION=true`

Named Supabase target: `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

Current run status: `not_run_confirmation_absent`

## Fail-Closed Behavior

If the confirmation is absent, the runner writes sanitized local evidence under `/tmp/reeditpro-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed/<runId>/` and exits with blocker `blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation`.

If the confirmation is present but `SUPABASE_ACCESS_TOKEN` is absent, the runner exits with blocker `blocked_missing_supabase_access_token_for_readonly_target_identity`.

If target identity passes but `REEDITPRO_SUPABASE_READONLY_DB_URL` is absent, the runner exits with blocker `blocked_missing_readonly_rls_storage_metadata_context`.

## Allowed Confirmed Checks

- `supabase projects list --output json` for read-only target identity confirmation.
- `supabase db lint --db-url [redacted] --schema public,storage --level warning --fail-on none` for read-only advisor/RLS/storage-schema lint evidence.

The runner isolates `HOME` under the `/tmp` proof directory so Supabase CLI telemetry/profile state is not written to the user's home directory or the repository.

No secret payloads, access tokens, database URLs, service-role keys, anon keys, signed URLs, or private artifact paths may be written to reports.
