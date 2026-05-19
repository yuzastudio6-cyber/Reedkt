# Supabase Deployment Readiness

## Current Status

- Migrations exist in the repo for RP-DB-03 through RP-DB-10.
- Local schema appears planned and documented.
- `src/backend/supabase/` contains placeholders only.
- No real Supabase client is configured.
- No remote deployment is confirmed.
- No local project link is confirmed.
- The intended Supabase project is `reeditpro`.
- The Yuza Studio Supabase project must not be used.
- `202605130009_soundsync_music_intelligence.sql` is not present on this branch.

## Deployment Prerequisites

Before remote deployment:

1. Confirm the correct Supabase project is `reeditpro`.
2. Confirm no Yuza Studio project is linked.
3. Install and verify the Supabase CLI.
4. Add local-only Supabase config if needed without committing secrets.
5. Run local migrations successfully.
6. Confirm RLS helper functions work.
7. Confirm migration order is correct.
8. Add or restore the SoundSync audio migration if it is required before deployment.
9. Confirm no duplicate enum/constraint errors.
10. Confirm seed/mock data is local-only.
11. Confirm `.env` values are not committed.
12. Keep service role keys backend-only.
13. Confirm Supabase Storage bucket strategy.
14. Confirm Auth profile bootstrap strategy.
15. Confirm backup/export plan before remote push.
16. Confirm deployment environment and rollback plan.

## Do Not Deploy Yet

This task does not deploy, link, push, or run remote migrations. Do not run:

- `supabase db push`
- `supabase migration up --linked`
- `supabase link`
- `supabase secrets set`

## CLI Status

`supabase --version` was attempted during planning and was not available in the local shell. Local validation cannot proceed until the Supabase CLI is installed.

## Secret Safety

Observed in quick check:

- `.env.example` exists.
- `.env`, `.env.local`, `.env.production`, `supabase/config.toml`, and `supabase/.temp` were not found.

No secret values were printed.

## Next Step

Recommended next Supabase milestone:

`RP-SUPABASE-01 - Local Supabase Setup + Migration Validation`

Do this before any remote deployment to `reeditpro`.
