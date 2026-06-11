# SUPABASE-SOUND-4-HARNESS-CONFIG-PLAN Safe Local Supabase Config Plan

## Status

- Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.
- Requesting workstream: SOUND_MUSIC_AUDIO.
- Current SOUND stage: dry_run_passed.
- Target future stage: generated_local_fixture_passed.
- This document is config-plan-only.
- This document does not create `supabase/config.toml`.
- This document does not edit `supabase/config.toml`.
- This document does not execute SQL.
- This document does not run Supabase CLI commands.
- This document does not use Docker.
- This document does not create databases.
- This document does not drop databases.
- This document does not start services.
- This document does not install packages.
- This document does not deploy migrations.
- This document does not touch Supabase cloud.
- This document does not create rows, storage objects, signed URLs, generated assets, jobs, credit rows, or approval records.
- This document does not call providers, dispatch workers, run media processing, run render/export, or unlock generated_local_fixture_passed.

## Current prerequisite status

- Host architecture: arm64.
- Homebrew path: `/opt/homebrew/bin/brew`.
- Node path: `/opt/homebrew/bin/node`.
- Node architecture: arm64.
- Node version verified in the prior no-SQL check: v26.3.0.
- Supabase CLI path: `/opt/homebrew/bin/supabase`.
- Supabase CLI architecture: arm64.
- Supabase CLI version verified in the prior no-SQL check: 2.105.0.
- Docker CLI path: `/usr/local/bin/docker`.
- Docker CLI availability verified in the prior no-SQL check.
- `supabase/config.toml` remains missing.
- Local harness retry remains blocked until a safe local config exists.
- generated_local_fixture_passed remains unclaimed.

## Source-of-truth rule

```text
Supabase row
+ private GCS path
+ manifest
+ checksum
+ approved plan snapshot
```

Signed URLs are not source of truth. Public URLs and public artifacts remain blocked.

## Raw prompt rule

```text
user/chat request
→ structured agent findings
→ edit intents
→ approved plan snapshot
→ worker execution
```

Raw prompt execution remains blocked. Local config planning must not turn chat text into direct worker execution, provider execution, media processing, storage mutation, or billing activity.

## Safe config requirements

- The future config must be local-only.
- The future config must be for the ReEditPro SOUND local harness only.
- The future config must contain no secrets.
- The future config must contain no anon key values.
- The future config must contain no service_role key values.
- The future config must contain no access tokens.
- The future config must contain no JWT secret values.
- The future config must contain no database password values.
- The future config must contain no provider keys.
- The future config must contain no Stripe keys.
- The future config must contain no remote project refs.
- The future config must contain no Supabase cloud URL.
- The future config must contain no production project identifiers.
- The future config must contain no staging project identifiers.
- The future config must contain no live customer data references.
- The future config must support Supabase platform schemas through normal local Supabase stack behavior.
- The future config must not create, edit, reorder, or deploy active migrations.
- The future config must not reference provider calls, worker dispatch, public artifacts, signed URLs as source of truth, or generated asset creation.
- The future config must be validated by a text-only smoke before any local harness retry.

## Forbidden config values

- `service_role` key values.
- anon key values.
- `access_token` values.
- JWT secret values.
- database password values.
- provider keys.
- Stripe keys.
- remote project refs.
- Supabase cloud URLs.
- production or staging project identifiers.
- signed URL settings as source of truth.
- public artifact delivery settings.
- worker execution settings.
- provider execution settings.

## Proposed future config shape

The future config should be a minimal local-only Supabase CLI config for the ReEditPro SOUND harness. It should use a local project id/name such as `reeditpro_sound_local_harness`, rely on local Supabase stack defaults for platform-provided `auth` and `storage` schemas, and avoid any branch/remotes block or cloud project reference.

The future config shape should be described and reviewed before creation. It should not include a full applied TOML body in this plan, because this prompt must not create or imply an applied config. The future config may define only local project identity and explicitly local development settings that are required by repo conventions. It must not include secrets, cloud URLs, edge function secrets, provider secrets, worker dispatch settings, signed URL source-of-truth settings, public artifact delivery settings, production identifiers, staging identifiers, or live-data references.

## Config creation safety criteria for next prompt

- Source-of-truth still permits a local-only config.
- The repo still lacks `supabase/config.toml`.
- Compatible arm64 Supabase CLI remains verified.
- Compatible arm64 Node remains verified.
- Docker CLI remains verified.
- No cloud link is configured.
- No production target is configured.
- No staging target is configured.
- No live customer data is referenced.
- No secrets or environment values are printed.
- No active migration under `supabase/migrations` is created for the SOUND draft.
- Draft SQL and draft test files remain unchanged.
- A text-only smoke validates the config content before any harness run.
- The config creation prompt does not run Supabase CLI commands.
- The config creation prompt does not run Docker.
- The config creation prompt does not execute SQL.
- generated_local_fixture_passed remains unclaimed.

## Runtime gates

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

## Supabase update classification

- Supabase update required: no live update.
- Supabase update status: config plan only, no SQL, no deploy.
- Supabase environment touched: no.
- SQL executed: no.
- Migration deployed: no.
- Storage touched: no.
- Rows created: no.
- Signed URLs created: no.
- Evidence docs: SUPABASE-SOUND-4-HARNESS-FIX, SUPABASE-SOUND-4-HARNESS-VERIFY, and this config plan.
- Blockers: `supabase/config.toml` is still missing; local harness was not retried; no local platform prerequisite proof exists from this prompt.
- Next Supabase action: create a safe local `supabase/config.toml` in a separate approved prompt without execution.

## Recommendation

SUPABASE-SOUND-4-HARNESS-CONFIG-CREATE: create safe local supabase/config.toml, no execution
