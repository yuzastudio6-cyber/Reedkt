# Prompt 20B Validation Results

Prompt 20B attempted the first local-only executable RLS smoke test on June 3, 2026 from branch `codex/rp-foundation-20b-local-rls-first-executable-smoke-test`, based on `origin/codex/rp-foundation-20g-local-supabase-migration-chain-repair`.

## Scope

Exact production capability enabled: `none; local-only RLS smoke validation`.

Prompt 20B did not touch staging, remote, or production Supabase. It did not run provider calls, rendering/export, tool execution, worker execution, production job claims, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, beta unlock, production migration deployment, dependency mutation, or broad service-role handlers.

## Files Added Or Updated

- Added `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`.
- Updated `scripts/validation/local-supabase-rls-runner.mjs` to ignore dotfile and AppleDouble SQL-shaped local artifacts.
- Updated local Supabase evidence and tracker docs for the Prompt 20B blocked run.

## Local Tool Gates

| Gate | Result |
| --- | --- |
| Host architecture | `arm64` |
| Supabase CLI | `/tmp/reeditpro-local-bin/supabase`, version `2.104.0` |
| `psql` | `/Applications/Postgres.app/Contents/Versions/latest/bin/psql`, version `18.4` |
| Docker daemon | reachable, server `29.5.2` |
| `supabase/config.toml` | present and local-only by static inspection |
| Remote risk | `remoteRiskDetected=false` |
| Local start gate | `canStartLocalSupabase=true` |
| Local SQL gate before start | blocked by `local_db_url_missing` |

## Local Supabase Start Result

`supabase start` was attempted only after the local toolchain probe and preflight reported no remote risk and allowed local start.

The local migration chain reached and passed the Prompt 20G repaired migration:

- `202605130007_generation_providers_generated_assets.sql`

The chain then failed at:

- `202605180001_reeditpro_core_workspace_projects.sql`

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

Root cause classification: another schema-era migration-chain conflict. Earlier migrations create `public.projects`; the later Prompt 3 canonical migration uses `create table if not exists` and then assumes the canonical `current_edit_session_id` column exists before adding its foreign key.

## SQL/RLS Execution Status

No SQL/RLS smoke test ran.

Reason: local `supabase start` failed before a localhost-only DB URL could be captured. Per the Prompt 20B gate, SQL execution stopped immediately.

The first local SQL candidate exists but remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

## Validation Status

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20g-local-supabase-migration-chain-repair...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports `remoteRiskDetected=false`, Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, blocker `local_db_url_missing` |
| `supabase start` | Failed at `202605180001_reeditpro_core_workspace_projects.sql` |
| `supabase status --output json` | Not run because start failed |
| `npm run supabase:rls:list-tests` | Passed; listed `001_auth_workspace_minimal_local_rls.sql` as a local executable candidate and executed no SQL |
| `npm run supabase:rls:local:dry-run` | Passed; executed no SQL and did not call `supabase status` |
| `npm run supabase:rls:local:dry-run -- --inspect-local-status` | Not run because local start failed and status capture is only allowed after successful start in this prompt |
| `npm run supabase:rls:local:run -- --confirm-local-only --file database/test-sql/local/001_auth_workspace_minimal_local_rls.sql` | Not run because start failed |
| `npm run build` | Environment-blocked locally by known Rolldown Darwin native binding/code-signature failure |
| `npm run build:server` | Environment-blocked locally by same Rolldown native binding/code-signature failure after server typecheck passed |
| `npm run foundation:validate:with-build` | Environment-blocked locally; required default checks passed and full build was classified as `environment_blocked` |

## Remaining Blockers

- Local migration chain fails at `202605180001_reeditpro_core_workspace_projects.sql`.
- No localhost-only DB URL was captured.
- No SQL/RLS test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.

## Decision

Prompt 20B is `validation_blocked`. The next milestone should be Prompt 20H - Local Supabase Migration Chain Repair Follow-Up, focused on the `current_edit_session_id` / canonical project table schema-era conflict.
