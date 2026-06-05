# Prompt: Supabase Track B Staging Backfill Rerun After Schema

Rerun the guarded PR #198 Track B milestone staging backfill after the activation milestone registry schema/RLS has been deployed and verified in staging.

Allowed:

- Read the committed Phase 44P Track B Supabase milestone export.
- Run PR #198 backfill preflight and diff.
- Write safe staging metadata rows only when all explicit PR #198 confirmations and server-side staging credentials are present.
- Verify written staging metadata and emit redacted reports.

Blocked:

- Production Supabase or production SQL.
- Migration deployment or schema mutation.
- Remote manual SQL.
- Provider calls, route execution, worker execution, tool execution, media/audio/OCR/VLM/model runtimes, public artifacts, beta unlock, production unlock, and Track A.

Expected command sequence:

```bash
npm run activation:supabase-trackb-backfill:preflight
npm run activation:supabase-trackb-backfill:diff
REEDITPRO_CONFIRM_SUPABASE_TRACKB_MILESTONE_STAGING_BACKFILL=true \
REEDITPRO_CONFIRM_SUPABASE_STAGING_METADATA_WRITE=true \
REEDITPRO_CONFIRM_TRACKB_SUPABASE_EXPORT_READ=true \
npm run activation:supabase-trackb-backfill -- --execute --staging --keep-temp
```
