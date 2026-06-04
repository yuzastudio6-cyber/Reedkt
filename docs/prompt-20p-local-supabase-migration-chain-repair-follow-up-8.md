# Prompt 20P Local Supabase Migration Chain Repair Follow-Up 8

Prompt 20P repairs a local-only storage migration-chain blocker in `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql`.

Exact production capability enabled: `none; local-only storage migration chain repair`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, SQL/RLS smoke test, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, non-Supabase process termination, production/beta unlock, or broad service-role handler was enabled.

## Original Prompt 20O Blocker

Prompt 20O resolved the local DB/Studio port conflict by moving local Supabase DB/Studio ports to `54330` and `54331`. Local `supabase start` then advanced through `202605180007_reeditpro_rls_policies.sql` and failed at:

```text
supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql
ERROR: must be owner of table buckets (SQLSTATE 42501)
At statement: 1
comment on table storage.buckets is 'ReeditPro buckets are private by default. Object paths should start with <project_id>/... for project-scoped access.'
```

Root cause: `storage.buckets` and policies on `storage.objects` are Supabase-owned storage schema objects in local validation. Database-level `COMMENT ON` statements against those objects can fail before policy validation continues, even when the comments are documentation-only.

## SQL Repair

Prompt 20P patches only:

- `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql`

Changes:

- removed `COMMENT ON TABLE storage.buckets`;
- removed both `COMMENT ON POLICY ... ON storage.objects` statements;
- preserved the same private-bucket and project-path policy intent as plain SQL comments in the migration;
- left bucket seed/upsert logic unchanged;
- left `DROP POLICY` and `CREATE POLICY` logic unchanged for this first retry.

This keeps the storage policy intent documented without requiring ownership of Supabase storage schema objects.

## Local Validation Result

Local validation was run with:

```text
/tmp/reeditpro-local-bin:/Applications/Postgres.app/Contents/Versions/latest/bin:/Applications/Codex.app/Contents/Resources:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20o-local-supabase-start-port-conflict-retry...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; reports Supabase CLI 2.104.0, Docker 29.5.2, `psql` 18.4, `remoteRiskDetected=false`, local SQL candidate present, and missing local DB URL |
| `npm run --silent supabase:local:preflight` | Passed; reports `remoteRiskDetected=false`, `canStartLocalSupabase=true`, `canResetLocalSupabase=true`, `canRunLocalSql=false`, and blocker `local_db_url_missing` |
| `supabase stop --no-backup` | Passed before local start; local-only cleanup, no backup |
| `supabase start` | Failed after passing `202605180008_reeditpro_storage_buckets_policies.sql`; next failure is in `202605200001_storage_upload_pipeline_readiness.sql` |
| `supabase status` | Not run because start failed |
| `npm run supabase:rls:list-tests` | Not run because start failed |
| `npm run supabase:rls:local:dry-run` | Not run because start failed |
| `npm run build` | Environment-blocked locally by the known Darwin Rolldown native binding/code-signature failure |
| `npm run build:server` | Environment-blocked locally by the same Rolldown native binding/code-signature failure after server typecheck passed |
| `npm run foundation:validate:with-build` | Completed with default checks passed and full build classified as local `environment_blocked` |

Prompt 20P confirms the repaired migration now passes during local start. The chain then stops later at:

```text
supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql
ERROR: must be owner of relation objects (SQLSTATE 42501)
At statement: 7
comment on policy "reeditpro_project_members_read_workspace_project_objects" on storage.objects is
  'RP-FIX-07 read policy for workspace/{workspace_id}/project/{project_id}/... paths. Reads require project membership.'
```

This is another storage ownership/privilege blocker in a later migration and is intentionally not repaired in Prompt 20P.

## Localhost DB URL Status

No localhost-only DB URL was captured because `supabase start` failed before a completed local service state.

`supabase status` was not run.

## SQL/RLS Status

No SQL/RLS smoke test ran.

The first local executable SQL candidate remains unexecuted:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

## Remaining Blockers

- Local migration-chain validation now fails in `202605200001_storage_upload_pipeline_readiness.sql` with `SQLSTATE 42501` on `COMMENT ON POLICY ... ON storage.objects`.
- No localhost-only DB URL has been captured.
- No SQL/RLS smoke test has executed.
- Staging and remote Supabase validation remain prohibited and unrun.
- Production beta remains blocked.
- Local Darwin full build remains environment-blocked by the known Rolldown native binding/code-signature issue; Linux CI remains the build evidence path.

## Next Prompt Recommendation

Recommended next prompt: Prompt 20P2 - Storage Ownership/Privilege Follow-Up, focused on storage-schema comment ownership/privilege handling in later migrations before Prompt 20B SQL execution is retried.
