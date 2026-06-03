# Prompt 20I Local Supabase Migration Chain Repair Follow-Up 2

Prompt 20I repairs the next local-only Supabase migration-chain blocker found by Prompt 20H.

Exact production capability enabled: `none; local-only Supabase migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler was enabled.

## Original Error

Prompt 20H repaired the Prompt 3-era core workspace/project migration compatibility blockers and advanced the local migration chain to:

- `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql`

Failure:

```text
ERROR: column "status" does not exist (SQLSTATE 42703)
At statement: 8
create index if not exists idx_media_assets_project_status on public.media_assets(project_id, status)
```

## Root Cause

Earlier schema-era migrations create `public.media_assets` before the Prompt 4-era media/source-sequence migration runs. Because `202605180002_reeditpro_media_source_sequence.sql` uses `create table if not exists public.media_assets`, the Prompt 4-era canonical table definition is skipped when the older table already exists.

The migration then attempted to create `idx_media_assets_project_status` against `public.media_assets.status`, but the older table did not have that column.

## SQL Repair

Prompt 20I changes only:

- `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql`

The repair:

- adds `media_assets.status text not null default 'uploaded'` when missing;
- adds `media_assets.size_bytes bigint` when missing;
- adds `media_assets.metadata_json jsonb not null default '{}'::jsonb` when missing;
- backfills `size_bytes` from legacy `file_size_bytes` only when both columns exist;
- backfills `metadata_json` from legacy `metadata` only when both columns exist;
- guards `idx_media_assets_project_status` creation behind checks for `public.media_assets`, `project_id`, `status`, and absence of the index.

Prompt 20I did not change `asset_type` enum/text shape, tighten nullable storage columns, rename tables, drop data, reorder migrations, rewrite migration history broadly, or add unrelated product/runtime changes.

## Local Validation Result

Local safety gates were run with the local tool PATH:

```text
/tmp/reeditpro-local-bin:/Applications/Postgres.app/Contents/Versions/latest/bin:/Applications/Codex.app/Contents/Resources:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

Local tool status:

- Supabase CLI: `/tmp/reeditpro-local-bin/supabase`, version `2.104.0`
- `psql`: `/Applications/Postgres.app/Contents/Versions/latest/bin/psql`, version `18.4`
- Docker daemon: reachable, server `29.5.2`
- `remoteRiskDetected=false`
- `canStartLocalSupabase=true`

`supabase stop --no-backup` was run before local start to clear stale local state. `supabase start` was attempted only after local-only gates passed.

Prompt 20I passed the repaired migration:

- `202605180002_reeditpro_media_source_sequence.sql`

The chain then failed at the next migration:

```text
ERROR: column "edit_plan_version_id" does not exist (SQLSTATE 42703)
At statement: 14
create index if not exists idx_edit_plan_segments_plan_order on public.edit_plan_segments(edit_plan_version_id, segment_order)
```

Next blocker classification: another schema-era migration-chain conflict in `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`. Earlier migrations create `public.edit_plan_segments`; the Prompt 4/5-era intent-plan migration uses `create table if not exists` and then assumes the canonical `edit_plan_version_id` column exists before creating the plan/order index.

## Validation Commands

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20h-local-supabase-migration-chain-repair-follow-up...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Initially failed on untracked AppleDouble `._*` local artifacts; passed after those artifacts were removed from the worktree |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start and after the failed start; local-only cleanup, no backup |
| `supabase start` | Failed after passing `202605180002_reeditpro_media_source_sequence.sql`; stopped at `202605180003_reeditpro_intent_plan_versions.sql` on missing `public.edit_plan_segments.edit_plan_version_id` |
| `supabase status --output json` | Not run because start failed |
| `npm run build` | Environment-blocked locally by known Darwin Rolldown native binding/code-signature failure |
| `npm run build:server` | Environment-blocked locally by same Rolldown native binding/code-signature failure after server typecheck passed |
| `npm run foundation:validate:with-build` | Environment-blocked locally; required default checks passed and full build was classified as `environment_blocked` |

## Localhost DB URL Status

No localhost-only DB URL was captured because `supabase start` failed before a complete local start.

`supabase status --output json` was not run.

## SQL/RLS Status

No SQL/RLS smoke test ran.

The first local executable SQL candidate remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

## Remaining Blockers

- Local migration chain now fails at `idx_edit_plan_segments_plan_order` in `202605180003_reeditpro_intent_plan_versions.sql`.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20J - Local Supabase Migration Chain Repair Follow-Up 3, focused on the next exact schema-era conflict in `202605180003_reeditpro_intent_plan_versions.sql`.
