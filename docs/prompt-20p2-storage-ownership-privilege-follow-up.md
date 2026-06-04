# Prompt 20P2 Storage Ownership/Privilege Follow-Up

Prompt 20P2 repairs a local-only storage ownership blocker in `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql`.

Exact production capability enabled: `none; local-only storage ownership/privilege repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, non-Supabase process termination, production/beta unlock, or broad service-role handler was enabled.

## Original Prompt 20P Blocker

Prompt 20P removed documentation-only `COMMENT ON` statements from `202605180008_reeditpro_storage_buckets_policies.sql`. Local `supabase start` then advanced to the later storage migration and failed at:

```text
supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql
ERROR: must be owner of relation objects (SQLSTATE 42501)
At statement: 7
comment on policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects is
  'RP-FIX-07 read policy for workspace/{workspace_id}/project/{project_id}/... paths. Reads require project membership.'
```

Root cause: Supabase owns `storage.objects`. Database-level `COMMENT ON POLICY ... ON storage.objects` statements are documentation-only, but they require ownership privileges in local validation. They can block the migration chain even though they do not change bucket or policy behavior.

## SQL Repair

Prompt 20P2 patches only:

- `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql`

Changes:

- converted both `COMMENT ON POLICY ... ON storage.objects` statements into plain SQL comments near the related storage policy block;
- preserved the policy intent that project members can read `workspace/{workspace_id}/project/{project_id}/...` paths;
- preserved the policy intent that project editors can upload source media and thumbnails only;
- left bucket seed/upsert logic unchanged;
- left `DROP POLICY` and `CREATE POLICY` semantics unchanged;
- did not alter storage ownership, bucket public/private behavior, policy predicates, storage tables, signed URLs, or storage object transfer behavior.

## Local Validation Result

Local validation was run with:

```text
/tmp/reeditpro-local-bin:/Applications/Postgres.app/Contents/Versions/latest/bin:/Applications/Codex.app/Contents/Resources:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20p-local-supabase-migration-chain-repair-follow-up-8...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local SQL candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start; local-only cleanup, no backup |
| `supabase start` | Passed; local migration chain completed |
| `supabase status --output json` | Passed; evidence was sanitized to localhost DB host/port/database only |
| `npm run supabase:rls:list-tests` | Passed; listed tests and executed no SQL |
| `npm run supabase:rls:local:dry-run` | Passed; executed no SQL and did not call `supabase status` |
| `npm run build` | Environment-blocked locally by the known Darwin Rolldown native binding/code-signature failure |
| `npm run build:server` | Environment-blocked locally by the same Rolldown native binding/code-signature failure after server typecheck passed |
| `npm run foundation:validate:with-build` | Completed with default checks passed and full build classified as local `environment_blocked` |

## Localhost DB Evidence

`supabase status` verified a localhost-only database target:

| Field | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `54330` |
| Database | `postgres` |
| Local-only | yes |

No anon key, service-role key, JWT secret, storage key, API key, token, or full connection string is recorded in this document.

## SQL/RLS Status

No SQL/RLS smoke test ran.

The first local executable SQL candidate remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

Prompt 20P2 intentionally stops at local migration-chain validation and non-SQL runner checks. The guarded runner still reports `local_db_url_missing` unless a localhost-only DB URL is supplied through an approved local environment variable or inspected explicitly in a later approved SQL-execution prompt.

## Remaining Blockers

- No SQL/RLS smoke test has executed.
- The guarded runner still needs an approved localhost-only DB URL in env or explicit local status inspection before SQL execution.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.
- Local Darwin full build remains environment-blocked by the known Rolldown native binding/code-signature issue; Linux CI remains the full-build evidence path.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20B-Retry - Local RLS First Executable Smoke Test Run, because the local migration chain now starts successfully and localhost DB evidence was verified without running SQL.
