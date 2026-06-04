# Prompt 20N Local Supabase Migration Chain Repair Follow-Up 7

Prompt 20N repairs the next local-only Supabase migration-chain blocker found by Prompt 20M.

Exact production capability enabled: `none; local-only migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler was enabled.

## Original Error

Prompt 20M repaired the Prompt 11-era QA/export/audit compatibility blocker and advanced the local migration chain to:

- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`

Failure:

```text
ERROR: cannot change name of input parameter "target_workspace_id" (SQLSTATE 42P13)
At statement: 10
create or replace function public.is_workspace_member(workspace_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = workspace_uuid
      and wm.user_id = auth.uid()
  );
$$
```

## Root Cause

Earlier migration files already create `public.is_workspace_member(uuid)` with input parameter name `target_workspace_id`. PostgreSQL does not allow `create or replace function` to rename an existing function input parameter in place, even when the argument type signature is unchanged.

Static inspection found the same earlier parameter-name pattern for `public.is_workspace_owner_or_admin(uuid)`, so Prompt 20N repairs both workspace helper definitions in the same narrow RLS migration. `public.is_project_member(project_uuid uuid)` and `public.is_project_editor(project_uuid uuid)` are left unchanged because static inspection did not find earlier same-signature definitions for those helpers.

## SQL Repair

Prompt 20N changes only:

- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`

The repair:

- changes `public.is_workspace_member(workspace_uuid uuid)` to `public.is_workspace_member(target_workspace_id uuid)`;
- updates the body to compare `wm.workspace_id = target_workspace_id`;
- changes `public.is_workspace_owner_or_admin(workspace_uuid uuid)` to `public.is_workspace_owner_or_admin(target_workspace_id uuid)`;
- updates the body to compare `wm.workspace_id = target_workspace_id` and `w.id = target_workspace_id`.

Prompt 20N did not drop functions, cascade dependencies, redesign RLS policies, add broad policy guards, rename tables, drop data, reorder migrations, run SQL/RLS smoke tests, or broaden the repair beyond this migration.

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
- `canResetLocalSupabase=true`

`supabase stop --no-backup` was run before local start to clear stale local state. `supabase start` was attempted only after local-only gates passed.

Prompt 20N did not reach the migration-chain retry because local `supabase start` failed before migration application:

```text
failed to start docker container "supabase_db_reeditpro-local": Error response from daemon: ports are not available: exposing port TCP 0.0.0.0:54322 -> 127.0.0.1:0: listen tcp 0.0.0.0:54322: bind: address already in use
```

Non-mutating port inspection showed:

```text
rapportd ... TCP *:54322 (LISTEN)
```

Blocker classification: local environment port conflict before migration validation. Prompt 20N's SQL repair is static and scoped, but `supabase start` did not prove whether the migration chain passes `202605180007_reeditpro_rls_policies.sql`.

## Validation Commands

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20m-local-supabase-migration-chain-repair-follow-up-6...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local SQL candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start; local-only cleanup, no backup |
| `supabase start` | Failed before migrations because localhost port `54322` is already bound by `rapportd` |
| `supabase status` | Not run because start failed |
| `npm run build` | Environment-blocked locally by the known Darwin Rolldown native binding/code-signature failure |
| `npm run build:server` | Environment-blocked locally by the same Rolldown native binding/code-signature failure after server typecheck passed |
| `npm run foundation:validate:with-build` | Completed with default checks passed and full build classified as local `environment_blocked` |

## Localhost DB URL Status

No localhost-only DB URL was captured because `supabase start` failed before a complete local start.

`supabase status` was not run.

## SQL/RLS Status

No SQL/RLS smoke test ran.

The first local executable SQL candidate remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

## Remaining Blockers

- Local migration-chain retry is blocked before migrations because localhost port `54322` is already bound by `rapportd`.
- Prompt 20N's RLS helper parameter-name repair has not yet been proven by a successful `supabase start`.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.
- Local Darwin full build may remain environment-blocked by the known Rolldown native binding/code-signature issue; Linux CI remains the build evidence path.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20O - Local Supabase Start Port Conflict And Migration Chain Retry, focused on clearing or routing around the local-only `54322` bind conflict and retrying `supabase start` without running SQL/RLS smoke tests.

## Prompt 20O Follow-Up

Prompt 20O resolved the local port conflict without killing `rapportd` by changing local Supabase config:

- `[db].port`: `54322` -> `54330`
- `[studio].port`: `54323` -> `54331`

Local `supabase start` then passed `202605180007_reeditpro_rls_policies.sql`, proving the Prompt 20N RLS helper parameter-name repair no longer blocks that migration.

The next local migration-chain blocker is:

```text
supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql
ERROR: must be owner of table buckets (SQLSTATE 42501)
At statement: 1
comment on table storage.buckets is 'ReeditPro buckets are private by default. Object paths should start with <project_id>/... for project-scoped access.'
```

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.

Recommended next prompt: Prompt 20P - Local Supabase Migration Chain Repair Follow-Up 8.
