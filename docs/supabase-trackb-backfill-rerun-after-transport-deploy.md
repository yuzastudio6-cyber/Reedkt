# Track B Backfill Rerun After Transport Deploy

After staging schema/RLS deploy and verification pass, rerun PR #198 guarded Track B staging backfill as a separate phase.

This transport phase may run only PR #198 preflight, diff, and report after schema verification. It must not set:

- `REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL`
- `REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE`
- production Supabase confirmations

The next backfill phase must re-check the Phase 44P export schema, registry schema/RLS state, allowed metadata rows, cleanup/rollback policy, and secret redaction before any staging metadata write.
