# SUPABASE-SOUND-4-HARNESS-FIX Local Supabase Harness Setup Fix

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE
- Requesting workstream: SOUND_MUSIC_AUDIO
- Current SOUND stage: dry_run_passed
- Target future stage: generated_local_fixture_passed
- This document is setup-fix-only.
- This document does not execute SQL.
- This document does not run Supabase CLI commands.
- This document does not use Docker.
- This document does not create databases.
- This document does not start services.
- This document does not deploy migrations.
- This document does not touch Supabase cloud.
- This document does not unlock generated_local_fixture_passed.

## Previous Harness Blocker

- SUPABASE-SOUND-4-RETRY-HARNESS was blocked.
- `supabase/config.toml` was absent.
- No approved repo-local harness was found.
- The local Supabase binary reported `bad CPU type in executable`.
- No harness execution occurred.
- No SQL executed.
- Supabase cloud was not touched.

## Source-of-truth Rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs and public artifacts remain blocked.

## Raw Prompt Rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution remains blocked. A local harness setup fix must not turn chat text into direct worker execution, provider execution, media processing, storage mutation, or billing activity.

## Local Setup Inspection

- `supabase/config.toml` exists: no.
- Supabase binary path found: yes.
- Supabase binary path: `/usr/local/bin/supabase`.
- Supabase binary architecture status: incompatible.
- Supabase binary file output: `Mach-O 64-bit executable x86_64`.
- Host architecture: `arm64`.
- Docker binary found: yes.
- Docker binary path: `/usr/local/bin/docker`.
- psql found: yes.
- psql path: `/Applications/Postgres.app/Contents/Versions/latest/bin/psql`.
- pg_isready found: yes.
- pg_isready path: `/Applications/Postgres.app/Contents/Versions/latest/bin/pg_isready`.
- Repo-local harness found: no.
- Setup can be fixed by repo files alone: no.
- Manual user action required: yes, a compatible local Supabase CLI is required before another approved harness retry.

## Fix Decision

- setupFixDecision: `harness_setup_blocked_pending_compatible_supabase_cli`.
- Reason: source-of-truth allows future local Supabase-compatible harness execution only after safety gates repeat, but this repo does not define an approved local config/harness shape and the local Supabase binary is incompatible with the host architecture.
- `supabase/config.toml` was not created because creating a new local harness config would define a harness surface that source-of-truth does not yet specify.
- readyForHarnessRetry: false.

## Config Result

- `supabase/config.toml` created: no.
- Reason not created: no approved repo-local harness/config convention exists, and the immediate blocker is still a compatible Supabase CLI.
- secrets included: false.
- service role key included: false.
- anon key included: false.
- access token included: false.
- remote project ref included: false.
- Supabase cloud URL included: false.
- draft SQL/test files changed: false.
- active migrations changed: false.
- local harness runtime files created: false.

## Remaining Manual/setup Requirements

- Install or provide a compatible local Supabase CLI for the host architecture.
- Keep Docker availability as a future-only requirement if the approved local Supabase stack path is used.
- Do not link to Supabase cloud.
- Do not target production.
- Do not target staging.
- Do not use live customer data.
- Do not print secrets or environment values.
- Repeat safety gates before any retry.
- Keep the final owner evidence rollup valid.
- Keep the fixed draft SQL and draft test files unchanged unless a separate fix prompt changes them.
- Do not claim generated_local_fixture_passed.

## Future Retry Criteria

- `supabase/config.toml` exists and is local-only, or an approved repo-local harness exists.
- A compatible Supabase CLI is available.
- Docker is available if the local Supabase stack path is used.
- No source-of-truth conflicts are found.
- Final owner evidence rollup remains valid.
- Draft SQL/test files remain unchanged.
- No cloud target is configured.
- No production/staging/live-data target is configured.
- No secrets are printed.
- The next prompt repeats safety gates before any harness execution.

## Runtime Gates

- SQL executed: false.
- Supabase CLI executed: false.
- Docker used: false.
- database created: false.
- database dropped: false.
- service started: false.
- package installed: false.
- Supabase cloud touched: false.
- active migration created: false.
- migration deployed: false.
- Supabase mutation performed: false.
- rows created: false.
- storage objects created: false.
- signed URLs created: false.
- provider calls made: false.
- workers dispatched: false.
- generated audio created: false.
- generated assets created: false.
- media processing run: false.
- FFmpeg or ffprobe run: false.
- model inference run: false.
- render run: false.
- mux run: false.
- export run: false.
- credit spend occurred: false.
- public artifacts created: false.
- generated_local_fixture_passed claimed: false.

## Supabase Update Classification

- Supabase update required: no live update.
- Supabase update status: local harness setup fix only, no SQL, no deploy.
- Supabase environment touched: no.
- SQL executed: no.
- Migration deployed: no.
- Storage touched: no.
- Rows created: no.
- Signed URLs created: no.
- Evidence docs: SUPABASE-SOUND-4-RETRY-HARNESS blocked result plus this harness setup fix.
- Blockers: missing `supabase/config.toml`, no approved repo-local harness, incompatible local Supabase CLI binary, no platform prerequisite proof.
- Next Supabase action: install or provide a compatible local Supabase CLI before another approved harness retry.

## Recommendation

SUPABASE-SOUND-4-HARNESS-SETUP-USER: install compatible local Supabase CLI, no repo changes
