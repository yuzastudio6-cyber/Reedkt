# Track B Backfill After Staging Reset

Track B milestone backfill remains a separate phase after staging reset/reapply verification.

This phase may run only the PR #198 safe preflight, diff, and report paths after reset verification. It must not set:

- `REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL`
- `REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE`
- `REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ`

The next phase may request those confirmations only after the reset/reapply reports show staging migration history and schema/RLS verification passed.
