# Remote Table Verification

## Status

- Status: not queried
- Reason: Supabase CLI is unavailable and the linked project has not been confirmed as `reeditpro`.
- RP-FIX-04 safe deploy gate result: blocked before any remote command.
- No remote SQL queries were run.
- No table names were pulled from the remote database.
- No secrets were printed.
- No generated database types were created.

## Expected Table Groups

The local migrations are expected to create these table groups after a safe deployment:

- core: profiles, workspaces, subscriptions, projects, chat, media, source sequences, reference assets
- planning: intent analyses, source sequence maps, recommended edit structures, edit plans, story beats, segments, signature routes, instructions, planning notes
- edit quality: quality profiles, pacing, cuts, transitions, audio environment, ambience, music, SFX, captions, quality checks
- credits: wallets, grants, ledger entries, estimates, approvals, reservations, refunds, balance views
- jobs: job batches, jobs, dependencies, events, agent runs, worker runtime metadata, event logs, progress views
- Stroke Motion: plans, meaning expansions, beats, characters, symbols, timing anchors, storyboard frames, generation specs
- generation providers: providers, capabilities, models, requests, request inputs, generated assets, timing maps, events, costs
- render/preview/export/QA: render jobs, render inputs, renders, render events, exports, preview reviews, review comments, revision requests, QA reports
- SoundSync music and SFX Director: SFX event plans, provider routes, prompt plans, generated SFX metadata, trims, timing alignments, mixes, QA, library candidates, usage records
- StoryTiming: master timing maps, segments, anchors, events, dependencies, conflicts, resolutions, QA checks, render timing manifests, tracks, events, timing views

## Missing Tables

Unknown. Remote verification could not be performed.

## RP-FIX-04 Result

Remote table verification remains blocked because:

- `supabase --version` fails in this environment.
- `DEPLOY_TO_REEDITPRO_SUPABASE` is not set.
- `SUPABASE_ACCESS_TOKEN`, `REEDITPRO_SUPABASE_PROJECT_REF`, and `SUPABASE_DB_PASSWORD` are not set.
- `supabase/config.toml` is missing.
- `supabase/.temp/project-ref` exists but is not proof that the project is `reeditpro`.
- `src/backend/supabase/generated-database.types.ts` is missing and was not generated.

## Verification Limitation

Run this only after the Supabase CLI is available and the linked project is confirmed as `reeditpro`:

```powershell
supabase migration list --linked
supabase db query --linked "select table_schema, table_name from information_schema.tables where table_schema = 'public' order by table_name;"
supabase db query --linked "select version, name, inserted_at from supabase_migrations.schema_migrations order by version;"
```

Do not run destructive SQL or migration repair commands.
