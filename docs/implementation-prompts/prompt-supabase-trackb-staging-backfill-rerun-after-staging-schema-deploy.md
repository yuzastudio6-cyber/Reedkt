# Prompt: Supabase Track B Staging Backfill Rerun After Staging Schema Deploy

Use this prompt only after the staging activation milestone registry schema/RLS deploy and verification have passed.

Goal:

- Rerun the guarded PR #198 Track B staging milestone metadata backfill.
- Use only the safe Phase 44P Track B milestone export.
- Write safe staging metadata rows only if PR #198 confirmations, credentials, schema/RLS verification, diff, rollback, and cleanup gates pass.

Do not:

- Mutate production.
- Deploy migrations.
- Run schema changes.
- Execute Track B routes/tools/workers.
- Process media.
- Call providers.
- Print or commit secrets.
- Unlock beta or production.

Expected first commands:

```bash
npm run activation:supabase-trackb-backfill:preflight
npm run activation:supabase-trackb-backfill:diff
npm run activation:supabase-trackb-backfill:report
```

Proceed to a staging backfill write only in a separate approved phase with PR #198’s write confirmations.
