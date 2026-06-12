# Prompt: Supabase Track B Staging Backfill After Staging Reset

Use this prompt only after `activation:supabase-staging-reset-execution:verify` reports:

- `stagingResetReapplyComplete: true`
- `migrationHistoryVerified: true`
- `schemaRlsVerified: true`
- production unaffected
- Track B backfill rows written: false

Run PR #198 guarded Track B staging backfill as a separate staging metadata-write phase. Require explicit Track B backfill confirmations, validate the Phase 44P export, use server-side staging credentials only, and write only approved safe metadata rows.

Do not run production Supabase, direct/manual SQL, migration repair, providers, route/tool/worker execution, media processing, Track A, beta, or production unlocks.
