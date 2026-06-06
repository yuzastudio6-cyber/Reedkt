# Track B Backfill Rerun After Staging Schema Deploy

After this phase verifies the activation milestone registry schema/RLS in staging, the next Foundation/Supabase step is to rerun PR #198’s guarded Track B staging backfill.

The rerun remains separate and must not be performed here.

The future backfill rerun may read the safe Track B milestone export and write safe metadata rows only after its own confirmations are present.

This phase may run only PR #198 preflight, diff, and report scripts:

```bash
npm run activation:supabase-trackb-backfill:preflight
npm run activation:supabase-trackb-backfill:diff
npm run activation:supabase-trackb-backfill:report
```

Do not set PR #198 write confirmations during the schema deploy after-reference phase.
