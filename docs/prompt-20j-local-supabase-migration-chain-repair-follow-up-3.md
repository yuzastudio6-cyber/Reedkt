# Prompt 20J Local Supabase Migration Chain Repair Follow-Up 3

Prompt 20J repairs the next local-only Supabase migration-chain blocker found by Prompt 20I.

Exact production capability enabled: `none; local-only Supabase migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler was enabled.

## Original Error

Prompt 20I repaired the Prompt 4-era media/source-sequence migration compatibility blockers and advanced the local migration chain to:

- `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`

Failure:

```text
ERROR: column "edit_plan_version_id" does not exist (SQLSTATE 42703)
At statement: 14
create index if not exists idx_edit_plan_segments_plan_order on public.edit_plan_segments(edit_plan_version_id, segment_order)
```

## Root Cause

Earlier schema-era migrations create `public.edit_plan_segments` before the Prompt 4/5-era intent-plan migration runs. Because `202605180003_reeditpro_intent_plan_versions.sql` uses `create table if not exists public.edit_plan_segments`, the newer canonical table definition is skipped when the older table already exists.

The migration then attempted to create `idx_edit_plan_segments_plan_order` against `public.edit_plan_segments.edit_plan_version_id`, but the older table did not have that column.

## SQL Repair

Prompt 20J changes only:

- `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql`

The repair:

- adds nullable compatibility column `edit_plan_segments.edit_plan_version_id uuid` when missing;
- ensures `edit_plan_segments.segment_order integer not null default 0` exists when missing;
- guards `edit_plan_segments_edit_plan_version_id_fkey` creation behind checks for `public.edit_plan_segments`, `public.edit_plan_versions`, both referenced columns, and absence of the constraint;
- keeps the compatibility FK nullable because historical rows cannot be safely mapped from legacy `edit_plan_id` to canonical `edit_plan_versions.id` in this prompt;
- guards `idx_edit_plan_segments_plan_order` creation behind checks for `public.edit_plan_segments`, `edit_plan_version_id`, `segment_order`, and absence of the index.

Prompt 20J did not backfill `edit_plan_version_id`, rename tables, drop data, reorder migrations, rewrite migration history broadly, or add unrelated product/runtime changes.

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

Prompt 20J passed the repaired migration:

- `202605180003_reeditpro_intent_plan_versions.sql`

The chain then failed at the next migration:

```text
ERROR: column "approved_plan_snapshot_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)
At statement: 12
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'credit_reservations_approved_plan_snapshot_id_fkey') then
    alter table public.credit_reservations
      add constraint credit_reservations_approved_plan_snapshot_id_fkey
      foreign key (approved_plan_snapshot_id) references public.approved_plan_snapshots(id) on delete set null;
  end if;
...
end $$
```

Next blocker classification: another schema-era migration-chain conflict in `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql`. Earlier migrations create `public.credit_reservations`; the Prompt 5/6-era credit/approval migration uses `create table if not exists` and then assumes `approved_plan_snapshot_id` exists before adding snapshot foreign keys.

## Validation Commands

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20i-local-supabase-migration-chain-repair-follow-up-2...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed; final rerun after docs/tracker updates also passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start and after the failed start; local-only cleanup, no backup |
| `supabase start` | Failed after passing `202605180003_reeditpro_intent_plan_versions.sql`; stopped at `202605180004_reeditpro_credits_approval_snapshots.sql` on missing `public.credit_reservations.approved_plan_snapshot_id` |
| `supabase status` | Not run because start failed |
| `npm run supabase:rls:list-tests` | Not run after the failed start |
| `npm run supabase:rls:local:dry-run` | Not run after the failed start |

## Localhost DB URL Status

No localhost-only DB URL was captured because `supabase start` failed before a complete local start.

`supabase status` was not run.

## SQL/RLS Status

No SQL/RLS smoke test ran.

The first local executable SQL candidate remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

## Remaining Blockers

- Local migration chain now fails in `202605180004_reeditpro_credits_approval_snapshots.sql` while adding `credit_reservations_approved_plan_snapshot_id_fkey`.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20K - Local Supabase Migration Chain Repair Follow-Up 4, focused on the next exact schema-era conflict in `202605180004_reeditpro_credits_approval_snapshots.sql`.

## Prompt 20K Follow-Up Status

Prompt 20K repaired the `public.credit_reservations.approved_plan_snapshot_id` blocker in `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql` by adding nullable compatibility snapshot reference columns, guarding approved snapshot FKs, and guarding `idx_credit_estimates_project_plan`.

Local `supabase start` now passes `202605180004_reeditpro_credits_approval_snapshots.sql` and fails at the next migration:

```text
ERROR: column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)
At statement: 11
create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id)
```

Prompt 20L - Local Supabase Migration Chain Repair Follow-Up 5 is now recommended for `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql`.
