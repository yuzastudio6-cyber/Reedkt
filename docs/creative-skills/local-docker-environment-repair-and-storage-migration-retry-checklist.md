# RP-BETA-INTEGRATION-15 Local Docker Environment Repair Checklist

## Docker

- Docker version checked.
- Docker context checked.
- Docker daemon checked.
- Docker Desktop was started only because it was installed and needed.
- Bounded retry was used.
- No Docker install commands were run.
- No Docker settings were changed.
- No alternate runtime was started.

## Supabase

- Remote-safety preflight passed.
- Port preflight passed.
- Supabase CLI version checked.
- Local stack start was attempted only for `reeditpro-local`.
- `supabase db reset --local --no-seed` ran locally.
- `reeditpro-local` was stopped by project ID after this pass started it.
- No `supabase link` was run.
- No `supabase db push` was run.

## Migration

- `202605180008_reeditpro_storage_buckets_policies.sql` was reached and did not repeat the storage comment blocker.
- `202605200001_storage_upload_pipeline_readiness.sql` produced a new same-class policy-comment ownership blocker.
- Creative Skill catalog migrations were not reached.
- Minimal Creative Skill catalog smoke did not run.

## Boundaries

- Protected files remained unchanged.
- No migration was changed.
- No canonical manifest change was made.
- No TypeScript contract change was made.
- No mock fixture or package file changed.
- No runtime, provider, worker, UI, or app behavior was added.
- No remote Supabase was used.
- No files were staged, committed, merged, or pushed.

## Fail The Prompt If

- Remote Supabase is used.
- `supabase link` is run.
- `supabase db push` is run.
- Docker is installed or Docker settings are changed.
- An existing local `reeditpro` stack is stopped.
- Any migration is changed.
- Creative Skill migrations are changed.
- The canonical manifest is changed.
- TypeScript contracts, mocks, or package files are changed.
- Local output leaks keys, passwords, tokens, or connection strings.
- Files are staged, committed, merged, or pushed.
