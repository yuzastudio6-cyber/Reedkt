# Prompt 20P2 - Storage Ownership/Privilege Follow-Up

## Summary

Prompt 20P2 repairs the local-only storage ownership blocker discovered after Prompt 20P.

- Branch: `codex/rp-foundation-20p2-storage-ownership-privilege-follow-up`
- Base: `origin/codex/rp-foundation-20p-local-supabase-migration-chain-repair-follow-up-8`
- PR: [PR #162](https://github.com/yuzastudio6-cyber/Reedkt/pull/162)
- PR title: `[foundation] Prompt 20P2 storage ownership privilege follow-up`
- Exact production capability enabled: `none; local-only storage ownership/privilege repair`

## Allowed Scope

- Patch only `supabase/migrations/202605200001_storage_upload_pipeline_readiness.sql`.
- Convert storage policy comments that require ownership on `storage.objects` into plain SQL comments.
- Preserve bucket seed/upsert logic and storage policy semantics.
- Run local-only safety checks and `supabase start`.
- Run `supabase status` after successful local start and record only sanitized localhost DB evidence.
- Run non-SQL RLS runner list/dry-run checks.

## Forbidden Scope

- No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, SQL/RLS smoke test execution, raw `psql`, `supabase db reset`, deployment, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, dependency mutation, production/beta unlock, non-Supabase process termination, or broad service-role handler.

## Implementation Record

Prompt 20P2 converts both remaining `COMMENT ON POLICY ... ON storage.objects` statements in `202605200001_storage_upload_pipeline_readiness.sql` into plain SQL comments. The existing read and upload policy intent remains documented, but the migration no longer requires ownership of Supabase-managed storage objects for documentation-only comments.

Bucket seed/upsert logic and storage `DROP POLICY` / `CREATE POLICY` statements are unchanged.

## Validation Checklist

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20p-local-supabase-migration-chain-repair-follow-up-8...HEAD` | Passed |
| `npm ci` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed |
| `npm run --silent supabase:local:preflight` | Passed; reports `canStartLocalSupabase=true`, `remoteRiskDetected=false`, `canRunLocalSql=false` |
| `supabase stop --no-backup` | Passed |
| `supabase start` | Passed |
| `supabase status --output json` | Passed; only DB host/port/name recorded |
| `npm run supabase:rls:list-tests` | Passed; no SQL executed |
| `npm run supabase:rls:local:dry-run` | Passed; no SQL executed |
| `npm run build` | Local environment-blocked by Darwin Rolldown native binding/code-signature issue |
| `npm run build:server` | Local environment-blocked by Darwin Rolldown native binding/code-signature issue |
| `npm run foundation:validate:with-build` | Completed with default checks passed and full build classified `environment_blocked` |

## Acceptance Criteria

- Storage ownership blocker in `202605200001_storage_upload_pipeline_readiness.sql` is repaired.
- Policy intent text is preserved as SQL comments.
- Storage bucket and policy behavior is not changed.
- Local `supabase start` passes.
- Localhost DB evidence is captured without secrets.
- No SQL/RLS smoke test runs.
- No remote/staging/production target is touched.

## Next Prompt

Prompt 20B-Retry - Local RLS First Executable Smoke Test Run.
