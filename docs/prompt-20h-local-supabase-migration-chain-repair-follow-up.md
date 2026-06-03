# Prompt 20H Local Supabase Migration Chain Repair Follow-Up

Prompt 20H repairs the next local-only Supabase migration-chain blocker found by Prompt 20B.

Exact production capability enabled: `none; local-only Supabase migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler was enabled.

## Original Error

Prompt 20B created the first local-only auth/workspace/project SQL candidate and attempted local `supabase start` after no-remote safety gates passed. The migration chain failed in:

- `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`

Failure:

```text
ERROR: column "current_edit_session_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)
At statement:
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_current_edit_session_id_fkey'
  ) then
    alter table public.projects
      add constraint projects_current_edit_session_id_fkey
      foreign key (current_edit_session_id) references public.edit_sessions(id) on delete set null;
  end if;
end $$
```

## Root Cause

Earlier schema-era migrations create `public.projects` before the Prompt 3-era canonical migration runs. Because `202605180001_reeditpro_core_workspace_projects.sql` uses `create table if not exists public.projects`, the canonical table definition is skipped when the older `public.projects` table already exists.

The migration then attempted to add `projects_current_edit_session_id_fkey` against `public.projects.current_edit_session_id`, but the older table did not have that column.

## SQL Repair

Prompt 20H changes only:

- `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql`

The initial repair:

- adds `current_edit_session_id uuid` with `alter table public.projects add column if not exists current_edit_session_id uuid;` after `public.edit_sessions` exists;
- guards the foreign key creation with checks for `public.projects`, `public.edit_sessions`, `projects.current_edit_session_id`, `edit_sessions.id`, and absence of `projects_current_edit_session_id_fkey`;
- scopes the constraint absence check to `conrelid = to_regclass('public.projects')`.

Local validation then exposed additional compatibility assumptions in the same migration. Prompt 20H also adds:

- nullable `workspaces.owner_id` and `projects.owner_id` columns;
- guarded backfill from older schema-era `workspaces.owner_user_id` and `projects.created_by` when those columns exist;
- guarded `workspaces_owner_id_fkey` and `projects_owner_id_fkey` constraints;
- nullable `chat_messages.edit_session_id`;
- guarded `chat_messages_edit_session_id_fkey`.

Prompt 20H did not rename tables, drop data, reorder migrations, rewrite migration history broadly, or add unrelated product/runtime changes.

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

`supabase start` was attempted only after those local-only gates passed.

The first retry passed the repaired `projects_current_edit_session_id_fkey` section and exposed the next same-migration blocker:

```text
ERROR: column "owner_id" does not exist (SQLSTATE 42703)
At statement: 15
create index if not exists idx_workspaces_owner_id on public.workspaces(owner_id)
```

The second retry passed the owner-index blocker and exposed the next same-migration blocker:

```text
ERROR: column "edit_session_id" does not exist (SQLSTATE 42703)
At statement: 24
create index if not exists idx_chat_messages_session_created on public.chat_messages(edit_session_id, created_at)
```

The final retry passed `202605180001_reeditpro_core_workspace_projects.sql` and then failed in the next migration:

```text
ERROR: column "status" does not exist (SQLSTATE 42703)
At statement: 8
create index if not exists idx_media_assets_project_status on public.media_assets(project_id, status)
```

Root cause classification: another schema-era migration-chain conflict. Earlier migrations create `public.media_assets` before the Prompt 4-era media/source-sequence migration runs. `202605180002_reeditpro_media_source_sequence.sql` uses `create table if not exists public.media_assets`, then assumes the canonical `status` column exists before creating the project/status index.

## Validation Commands

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20b-local-rls-first-executable-smoke-test...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start retries and again after final failed start; local-only cleanup, no backup |
| `supabase start` | Failed after passing `202605180001_reeditpro_core_workspace_projects.sql`; stopped at `202605180002_reeditpro_media_source_sequence.sql` on missing `public.media_assets.status` |
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

- Local migration chain now fails at `idx_media_assets_project_status` in `202605180002_reeditpro_media_source_sequence.sql`.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20I - Local Supabase Migration Chain Repair Follow-Up, focused on the next exact schema-era conflict in `202605180002_reeditpro_media_source_sequence.sql`.
