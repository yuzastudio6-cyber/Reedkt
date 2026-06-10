# SUPABASE-SOUND-4-FIX Draft Migration Baseline Guard Fix

Status: draft-repair-only.

Workstream owner: SUPABASE_RLS_STORAGE_DATABASE.

Requesting workstream: SOUND_MUSIC_AUDIO.

Current stage: dry_run_passed.

Target future stage: generated_local_fixture_passed.

Claim made by this packet: generated_local_fixture_passed is not claimed.

This packet fixes the draft migration and draft test SQL text only. It does not execute SQL, create a database, drop a database, deploy a migration, mutate Supabase, create rows, create storage objects, create signed URLs, call providers, dispatch workers, create generated assets, process media, render, export, reserve credits, spend credits, or unlock any environment.

## Source-of-truth rule

The correct source-of-truth path remains:

```text
Supabase row + private GCS path + manifest + checksum + approved plan snapshot
```

Signed URLs are not source of truth. Public artifacts remain blocked.

## Raw-prompt rule

The correct execution path remains:

```text
user/chat request → structured agent findings → edit intents → approved plan snapshot → worker execution
```

Raw chat prompts must not become worker execution payloads.

## SUPABASE-SOUND-4-RETRY finding

SUPABASE-SOUND-4-RETRY attempted local throwaway draft validation against `reeditpro_sound_fixture_validation_throwaway`.

The draft migration failed before fixture-specific validation could run because the throwaway database did not include the ReEditPro baseline schema:

```text
relation "public.approved_plan_snapshots" does not exist
```

The draft tests were not run because the draft migration prerequisite failed. Cleanup was verified. Supabase cloud was not touched. No active migration was deployed. No generated_local_fixture_passed claim was made.

## Baseline dependency analysis

The draft migration is intended to extend and guard existing runtime surfaces. It is not a baseline schema bootstrap.

Hard baseline prerequisites now checked by the draft are:

- `public.approved_plan_snapshots`
- `public.storage_object_records`
- `public.signed_url_events`
- `public.generation_requests`
- `public.generated_assets`
- `public.jobs`
- `public.job_events`
- `public.sound_effect_plans`
- `public.ambient_sound_plans`
- `public.music_plans`
- `public.audio_environment_analysis`
- `public.qa_reports`
- `public.credit_estimates`
- `public.credit_approvals`
- `public.credit_reservations`
- `public.worker_runtime_configs`

The draft intentionally does not recreate these tables. A future validation run must load the approved ReEditPro baseline schema or use an approved local baseline validation harness before applying this draft.

## Optional local-baseline surfaces

`feature_gates` and `tool_capabilities` were observed in read-only live metadata during prior audits, but this branch does not expose an active local create-table source for them. The draft therefore treats those two surfaces as optional for comment-only handling. It never creates, seeds, or mutates feature gates or tool capabilities.

## Repair behavior

The draft migration and draft test SQL now both perform a baseline prerequisite guard using `to_regclass(...)`.

If any hard prerequisite is absent, the files raise the deterministic error:

```text
SUPABASE_SOUND_DRAFT_REQUIRES_BASELINE_SCHEMA
```

The error explicitly directs the next validation attempt to load the baseline ReEditPro schema or use an approved baseline validation harness. The error includes `public.approved_plan_snapshots` as the starting relation required by the SOUND fixture draft.

## What this does not prove

This fix does not prove:

- the draft migration passes against a baseline schema;
- the draft tests pass;
- local validation passed;
- generated/local fixture records are ready;
- generated_local_fixture_passed is claimable;
- Supabase cloud can be mutated;
- storage objects or signed URLs can be created;
- providers, workers, media processing, render/export, billing, or public delivery can run.

## Owner and runtime gates

All execution gates remain false:

- SQL execution by this prompt: false
- migration deployment: false
- Supabase cloud mutation: false
- rows created: false
- storage objects created: false
- signed URLs created: false
- provider calls: false
- worker dispatch: false
- generated audio/assets: false
- media processing: false
- render/mux/export: false
- credit reservation/spend: false
- public artifacts: false

Owner evidence remains conditional and no-execution only for SOUND, Supabase, Worker Runtime, Provider Gateway, Observability, Billing, Track A, and Track B.

## Next prompt

Recommended next prompt: `SUPABASE-SOUND-4-RETRY-BASELINE: run draft validation against approved local baseline schema, no deploy`.
