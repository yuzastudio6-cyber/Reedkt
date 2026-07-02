# RP-BETA-INTEGRATION-12 Local Migration Chain Blocker Repair For Workspace Member Function Signature Compatibility

## Purpose

RP-BETA-INTEGRATION-12 repairs the `is_workspace_member` function parameter-name blocker in `supabase/migrations/202605180007_reeditpro_rls_policies.sql`.

Repair decision:

- `workspace_member_function_parameter_name_compatibility_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Original Blocker

RP-BETA-INTEGRATION-11 stopped at:

- Migration: `supabase/migrations/202605180007_reeditpro_rls_policies.sql`
- Error: `cannot change name of input parameter "target_workspace_id"`
- Failing statement excerpt: `create or replace function public.is_workspace_member(workspace_uuid uuid)`

Creative Skill catalog migrations were not reached.

## Files Inspected

- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`
- `supabase/migrations/202605130001_core_reeditpro_tables.sql`
- `supabase/migrations/202605130003_professional_edit_quality_engine.sql`
- `docs/creative-skills/local-migration-chain-blocker-repair-202605180006-qa-report-approved-snapshot.md`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`

## Root Cause

Earlier migrations define:

```sql
create or replace function public.is_workspace_member(target_workspace_id uuid)
```

`202605180007_reeditpro_rls_policies.sql` attempted to replace that same function signature with a different input parameter name:

```sql
create or replace function public.is_workspace_member(workspace_uuid uuid)
```

PostgreSQL does not allow `create or replace function` to change the input parameter name for an existing function signature.

## RLS Intent

The intended behavior is unchanged:

- Check whether `auth.uid()` has a matching row in `public.workspace_members`.
- Scope the check to the provided workspace ID.
- Keep the function `security definer` with `search_path = public`.
- Preserve positional policy call sites such as `public.is_workspace_member(workspace_id)`.

No named-argument call sites were found that require the new `workspace_uuid` name.

## SQL Patch

The repair preserves the existing parameter name and updates the function body reference:

```sql
create or replace function public.is_workspace_member(target_workspace_id uuid)
...
where wm.workspace_id = target_workspace_id
```

No function was dropped or recreated. No RLS policy was broadened. No permissive policy, runtime behavior, provider behavior, worker behavior, UI behavior, or app behavior was added.

## Static SQL Review

- `is_workspace_member` now uses `target_workspace_id`.
- The body uses `target_workspace_id`.
- The old undefined `workspace_uuid` reference no longer appears in `is_workspace_member`.
- Policy call sites remain positional.
- No permissive catch-all policy was added.
- No new migration file was created.
- Creative Skill catalog migrations were not modified.
- The canonical manifest, TypeScript contracts, mock fixture, config, package files, runtime code, providers, workers, UI, and app behavior were not modified.

## Local Safety Preflight

Preflight passed:

- `supabase/config.toml` retained `project_id = "reeditpro-local"`.
- DB port remained `55432`.
- Ports `55430` through `55439` were free before start.
- No remote-risk Supabase environment variable names were found.
- No remote Supabase target, production URL, access token, service-role string, or Yuza reference was found in the local config scan.

## Local Supabase Result

Local commands:

- `supabase start`: passed for `reeditpro-local`.
- `supabase db reset --local --no-seed`: passed the repaired `is_workspace_member` blocker, then failed at the next helper in the same migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local command output stayed under `/tmp` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`

Sanitized error:

```text
cannot change name of input parameter "target_workspace_id"
```

Failing statement excerpt:

```sql
create or replace function public.is_workspace_owner_or_admin(workspace_uuid uuid)
```

Cause summary:

- Earlier migrations already define `public.is_workspace_owner_or_admin(target_workspace_id uuid)`.
- PostgreSQL rejects the replacement because `202605180007` changes the parameter name to `workspace_uuid`.

## Creative Skill Catalog Status

Creative Skill catalog migrations were not reached.

Minimal Creative Skill catalog smoke did not run.

## Local Side Artifacts

Existing local Supabase side artifacts remain present and untracked:

- `supabase/.branches/`
- `supabase/.temp/`

They were left in place and not staged.

## Protected-File Hash Result

Protected hashes changed only for the approved target migration:

- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`

Protected files that remained unchanged include:

- `supabase/config.toml`
- prior repaired migrations
- Creative Skill catalog migrations
- canonical seed manifest
- RP-SKILLS TypeScript contracts
- mock fixture
- package files

## Sanitization Statement

Docs and final reporting include only sanitized command names, exit statuses, migration names, counts, and summarized errors. Local keys, passwords, JWTs, access tokens, full connection strings, and full environment dumps were not copied into repo docs.

## Beta Integration Status

- `blocked_not_merge_ready`

## Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-13 - Local Migration Chain Repair for 202605180007 Workspace Owner/Admin Function Signature Compatibility`

The next prompt should patch only the concrete `is_workspace_owner_or_admin` function input-parameter compatibility issue in `202605180007_reeditpro_rls_policies.sql`, then rerun local-only reset.
