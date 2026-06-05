# Supabase Track B Backfill Verification

Verification sequence:

1. Validate the Phase 44P export and schema.
2. Confirm registry schema and RLS evidence already exist.
3. Confirm staging-only credentials are available server-side.
4. Generate a metadata diff for `activation_runs`.
5. Write staging metadata rows only with explicit confirmations.
6. Verify written rows by `phase_id` and `run_id`.
7. Record redacted audit and rollback evidence.

Verification must not run production SQL, deploy migrations, print secrets, execute tools/routes/workers, process media, or call providers.
