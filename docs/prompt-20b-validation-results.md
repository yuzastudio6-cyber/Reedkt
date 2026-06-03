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

## Prompt 20H Follow-Up

Prompt 20H repaired the `current_edit_session_id` migration-chain blocker in `supabase/migrations/202605180001_reeditpro_core_workspace_projects.sql` by adding the nullable compatibility column before the FK and guarding the FK creation with table, column, and scoped constraint checks.

Local retries exposed and repaired two additional same-migration compatibility blockers:

- missing `workspaces.owner_id` / `projects.owner_id` before owner indexes and Prompt 3-era policies;
- missing `chat_messages.edit_session_id` before `idx_chat_messages_session_created`.

After those repairs, local `supabase start` passed `202605180001_reeditpro_core_workspace_projects.sql` and advanced to the next migration-chain blocker:

```text
ERROR: column "status" does not exist (SQLSTATE 42703)
At statement: 8
create index if not exists idx_media_assets_project_status on public.media_assets(project_id, status)
```

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.

Prompt 20B remains blocked until the local migration chain starts successfully. The next milestone should be Prompt 20I - Local Supabase Migration Chain Repair Follow-Up, focused on `202605180002_reeditpro_media_source_sequence.sql`.

## Prompt 20I Follow-Up

Prompt 20I repaired the `public.media_assets.status` migration-chain blocker in `supabase/migrations/202605180002_reeditpro_media_source_sequence.sql` by adding additive Prompt 4-era compatibility columns for `status`, `size_bytes`, and `metadata_json`, guarded backfills from legacy columns, and guarded `idx_media_assets_project_status` creation.

After the repair, local `supabase start` passed `202605180002_reeditpro_media_source_sequence.sql` and advanced to the next migration-chain blocker:

```text
ERROR: column "edit_plan_version_id" does not exist (SQLSTATE 42703)
At statement: 14
create index if not exists idx_edit_plan_segments_plan_order on public.edit_plan_segments(edit_plan_version_id, segment_order)
```

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.

Prompt 20B remains blocked until the local migration chain starts successfully. The next milestone should be Prompt 20J - Local Supabase Migration Chain Repair Follow-Up 3, focused on `202605180003_reeditpro_intent_plan_versions.sql`.

## Prompt 20J Follow-Up

Prompt 20J repaired the `public.edit_plan_segments.edit_plan_version_id` migration-chain blocker in `supabase/migrations/202605180003_reeditpro_intent_plan_versions.sql` by adding the nullable compatibility column, guarding the plan-version FK, and guarding `idx_edit_plan_segments_plan_order`.

After the repair, local `supabase start` passed `202605180003_reeditpro_intent_plan_versions.sql` and advanced to the next migration-chain blocker:

```text
ERROR: column "approved_plan_snapshot_id" referenced in foreign key constraint does not exist (SQLSTATE 42703)
At statement: 12
credit_reservations_approved_plan_snapshot_id_fkey
```

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.

Prompt 20B remains blocked until the local migration chain starts successfully. The next milestone should be Prompt 20K - Local Supabase Migration Chain Repair Follow-Up 4, focused on `202605180004_reeditpro_credits_approval_snapshots.sql`.

## Prompt 20K Follow-Up

Prompt 20K repaired the `public.credit_reservations.approved_plan_snapshot_id` migration-chain blocker in `supabase/migrations/202605180004_reeditpro_credits_approval_snapshots.sql` by adding nullable compatibility snapshot reference columns, guarding approved snapshot foreign keys, and guarding `idx_credit_estimates_project_plan`.

After the repair, local `supabase start` passed `202605180004_reeditpro_credits_approval_snapshots.sql` and advanced to the next migration-chain blocker:

```text
ERROR: column "approved_plan_snapshot_id" does not exist (SQLSTATE 42703)
At statement: 11
create index if not exists idx_generation_requests_project_snapshot on public.generation_requests(project_id, approved_plan_snapshot_id)
```

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.

Prompt 20B remains blocked until the local migration chain starts successfully. The next milestone should be Prompt 20L - Local Supabase Migration Chain Repair Follow-Up 5, focused on `202605180005_reeditpro_generation_assets_jobs.sql`.

## Prompt 20L Follow-Up

Prompt 20L repaired the `public.generation_requests.approved_plan_snapshot_id` migration-chain blocker in `supabase/migrations/202605180005_reeditpro_generation_assets_jobs.sql` by adding the nullable compatibility column, guarding the approved snapshot FK, and guarding `idx_generation_requests_project_snapshot`. It also added `public.generated_asset_versions.version`, backfilled it from `version_number` where present, and guarded `idx_generated_asset_versions_asset_version`.

After the repair, local `supabase start` passed `202605180005_reeditpro_generation_assets_jobs.sql` and advanced to the next migration-chain blocker:

```text
ERROR: syntax error at or near "text" (SQLSTATE 42601)
At statement: 1
create table if not exists public.qa_check_results (
  id uuid primary key default gen_random_uuid(),
  qa_report_id uuid not null references public.qa_reports(id) on delete cascade,
  category text,
  label text,
  check text,
        ^
```

No SQL/RLS smoke test ran, no localhost-only DB URL was captured, and no staging/remote/production Supabase target was touched.

Prompt 20B remains blocked until the local migration chain starts successfully. The next milestone should be Prompt 20M - Local Supabase Migration Chain Repair Follow-Up 6, focused on `202605180006_reeditpro_qa_exports_audit.sql`.
