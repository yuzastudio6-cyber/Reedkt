# Supabase Track B Clean Staging Backfill

This phase backfills safe Track B milestone metadata into the activation registry on the clean staging branch only.

- Target project ref: `fnjiylwirntrqdcwpbho`
- Branch: `reeditpro-internal-staging-clean`
- Parent project ref: `wmyyttnynmteqgcdishd`
- Environment label: `clean_staging`
- Source export: `docs/activation-track-b-readiness-rollup-reports/track_b_supabase_milestone_export.json`

The backfill writes sanitized metadata rows only. It does not touch production, the broken original staging target, Track B tools, workers, routes, media/audio/OCR/VLM/model runtimes, providers, Track A, public artifacts, or beta/production unlocks.

The registry schema/RLS was created and verified in prior Foundation/Supabase work. This phase deploys no migration and performs no migration repair.

Required write confirmations:

- `REEDITPRO_CONFIRM_SUPABASE_TRACKB_CLEAN_STAGING_BACKFILL=true`
- `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_METADATA_WRITE=true`
- `REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_TARGET_PROOF=true`
- `REEDITPRO_CONFIRM_SUPABASE_TRACKB_SUPABASE_EXPORT_READ=true`
- `REEDITPRO_CONFIRM_SUPABASE_TRACKB_BACKFILL_DIFF_REVIEW=true`

The Supabase plugin write path is scoped to project `fnjiylwirntrqdcwpbho`. If that path is unavailable, the phase records blocker metadata instead of falling back to production, broken staging, service-role secrets, reset, migration repair, or manual schema work.
