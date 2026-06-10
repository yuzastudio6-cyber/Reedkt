# Prompt: Supabase Staging Reset Retry Execution

Use this only after the retry approval packet is reviewed.

Approval decision: `approved_for_future_retry_reset_after_cli_command_fix`
Approved future command shape: `npm exec --yes --package supabase@latest -- supabase db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed`

Execution constraints:

- Staging target only: Reeditpro / wmyyttnynmteqgcdishd / staging.
- Use secure DB URL process-env injection only; never print or commit the URL.
- Use temp npm Supabase CLI transport outside the repo.
- Run command-plan preview first; `db reset` has no dry-run flag in the current docs.
- Retry operation must be `db reset --db-url [REDACTED_STAGING_DB_URL] --no-seed`; do not add `--yes`.
- Do not run `supabase db push`, migration repair, direct/manual SQL, Track B backfill writes, production Supabase, providers, workers, routes, media processing, Track A, beta, or production unlocks.
- After retry, verify migration history, registry schema/RLS metadata, and run PR #198 preflight/diff/report only.
