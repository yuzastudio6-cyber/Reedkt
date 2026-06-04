# Prompt 20B-Retry Local RLS First Executable Smoke Test Run

Prompt 20B-Retry runs the first guarded local-only RLS smoke test after Prompt 20P2 proved the local Supabase migration chain can start.

Exact production capability enabled: `none; first local-only RLS smoke validation`.

No staging Supabase, remote Supabase, production Supabase, remote SQL, migration deployment to remote, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, production/beta unlock, schema-changing production migration, dependency mutation, or broad service-role handler was enabled.

## Branch And PR

- Branch: `codex/rp-foundation-20b-retry-local-rls-first-executable-smoke-test-run`
- Base: `origin/codex/rp-foundation-20p2-storage-ownership-privilege-follow-up`
- PR: pending

## Local Toolchain Status

Validation used this local-only path:

```text
/tmp/reeditpro-local-bin:/Applications/Postgres.app/Contents/Versions/latest/bin:/Applications/Codex.app/Contents/Resources:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin
```

| Gate | Result |
| --- | --- |
| Supabase CLI | `/tmp/reeditpro-local-bin/supabase`, version `2.104.0` |
| `psql` | `/Applications/Postgres.app/Contents/Versions/latest/bin/psql`, version `18.4` |
| Docker daemon | reachable, server `29.5.2` |
| Local config | `supabase/config.toml` present and local-only |
| Remote risk | `remoteRiskDetected=false` |

## Local Supabase Start And DB Evidence

`supabase start` passed locally.

`supabase status --output json` was parsed and only sanitized database evidence was recorded:

| Field | Value |
| --- | --- |
| Host | `127.0.0.1` |
| Port | `54330` |
| Database | `postgres` |
| Local-only | yes |

No anon key, service-role key, JWT secret, API key, token, or full connection string is recorded.

The current shell exported a localhost-only DB URL through `REEDITPRO_LOCAL_SUPABASE_DB_URL` so the guarded runner could verify `localDbUrlAvailable=true`.

## SQL Candidate And Compatibility Fix

The inspected SQL candidate was:

- `database/test-sql/local/001_auth_workspace_minimal_local_rls.sql`

The first guarded run executed the SQL and failed with a local schema compatibility error:

```text
ERROR: column "metadata_json" of relation "workspaces" does not exist
Failing statement: insert into public.workspaces (id, owner_id, name, metadata_json) ...
Classification: SQL test fixture/schema mismatch.
```

The local schema is an older-plus-canonical migration chain where `public.workspaces` still has legacy `owner_user_id`/`metadata`, and `public.projects` still has legacy `created_by`/`metadata`. The SQL candidate was updated only to bridge that local schema safely:

- seeded `public.user_profiles` rows with IDs matching the synthetic auth user IDs;
- used `workspaces.owner_user_id` plus `workspaces.owner_id`;
- used `projects.created_by` plus `projects.owner_id`;
- removed non-existent `workspaces.metadata_json`, `projects.metadata_json`, and `projects.editing_category` fixture columns.

The fixture remains synthetic and transaction-scoped, ending with `rollback`.

## Guarded SQL Result

The guarded command was:

```sh
npm run supabase:rls:local:run -- --confirm-local-only --file database/test-sql/local/001_auth_workspace_minimal_local_rls.sql
```

Final result: passed.

The runner executed exactly one SQL file, through `psql` internally, against the verified local DB URL. Generated evidence was written under ignored `.reeditpro-local-validation/` and was not committed.

Assertions covered:

- owner can select own profile;
- owner cannot select another user profile;
- owner can select own workspace;
- member can select assigned workspace and project;
- normal member cannot create privileged owner membership for another user;
- non-member cannot select the assigned workspace or project.

Not covered:

- storage/upload RLS;
- approved snapshots;
- credits;
- jobs/workers;
- media readiness;
- render/export;
- QA/revision;
- tools;
- providers;
- compliance/observability;
- staging, remote, or production Supabase.

## Validation Result

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20p2-storage-ownership-privilege-follow-up...HEAD` | Passed |
| `npm ci` | Passed; existing 5 moderate audit findings reported, no `npm audit fix` run |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; local DB URL missing before status/env export, then preflight ready after env export |
| `supabase start` | Passed |
| `supabase status --output json` | Passed; sanitized localhost DB evidence captured |
| `npm run --silent supabase:local:preflight` with local DB URL env | Passed; `canRunLocalSql=true`, `remoteRiskDetected=false` |
| `npm run supabase:rls:list-tests` | Passed; no SQL executed |
| `npm run supabase:rls:local:dry-run` | Passed; no SQL executed |
| guarded local SQL run | Passed after SQL fixture compatibility fix |
| `npm run build` | Local environment-blocked by Darwin Rolldown native binding code-signature / optional dependency loading failure |
| `npm run build:server` | Local environment-blocked by the same Darwin Rolldown native binding failure after server typecheck passed |
| `npm run foundation:validate:with-build` | Exited `0` with `overallStatus=environment_blocked`; required checks passed and full build remained locally blocked |

The local build blocker is the known host native-binding issue. Linux GitHub Foundation Validation is expected to provide the authoritative build evidence for this branch.

## Remaining Blockers

- This is partial local RLS evidence for one auth/workspace/project smoke test only.
- Staging Supabase/RLS remains unrun and requires a later explicit approval packet.
- Remote and production Supabase remain prohibited.
- Broader domain SQL tests remain draft-only or manual-review-only.
- Production beta remains blocked.

## Next Prompt Recommendation

Recommended next prompt: Prompt 21 - Staging Supabase/RLS Validation Runbook and Approval Packet.
