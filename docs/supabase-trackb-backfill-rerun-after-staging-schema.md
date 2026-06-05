# Supabase Track B Backfill Rerun After Staging Schema

After the activation milestone registry schema/RLS migration has been deployed and verified in staging, rerun PR #198 as a separate guarded Track B staging backfill phase.

This staging deploy/verify phase does not write Track B milestone rows. It only records whether the registry schema/RLS exists and whether PR #198 preflight/diff no longer reports `supabase_milestone_registry_schema_missing`.

## Rerun Preconditions

- Staging schema deploy report status is `passed`.
- Staging schema verification report status is `passed`.
- Staging RLS verification report status is `passed`.
- PR #198 preflight and diff reports pass without schema/RLS blockers.
- Operator supplies PR #198 staging write confirmations in the future backfill phase.

## Still Blocked

- Production Supabase and production SQL.
- Schema mutation in the Track B backfill phase.
- Seed insertion and milestone registry schema changes.
- Provider calls, route/tool/worker execution, media processing, public output, beta unlock, production unlock, and Track A.

## Next Command Sequence

```bash
npm run activation:supabase-trackb-backfill:preflight
npm run activation:supabase-trackb-backfill:diff
```

Only after the PR #198 gates pass:

```bash
REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true \
REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true \
REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ=true \
npm run activation:supabase-trackb-backfill -- --execute --staging --keep-temp
```
