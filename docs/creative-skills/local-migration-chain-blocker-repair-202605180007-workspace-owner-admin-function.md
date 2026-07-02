# RP-BETA-INTEGRATION-13 Local Migration Chain Blocker Repair For Workspace Owner/Admin Function Signature Compatibility

## Purpose

RP-BETA-INTEGRATION-13 repairs the `is_workspace_owner_or_admin` function parameter-name blocker in `supabase/migrations/202605180007_reeditpro_rls_policies.sql`.

Repair decision:

- `workspace_owner_admin_function_parameter_name_compatibility_repair`

Local reset decision:

- `local_chain_blocker_repaired_but_new_blocker_found`

## Original RP-BETA-INTEGRATION-12 Blocker

RP-BETA-INTEGRATION-12 stopped at:

- Migration: `supabase/migrations/202605180007_reeditpro_rls_policies.sql`
- Error: `cannot change name of input parameter "target_workspace_id"`
- Failing statement excerpt: `create or replace function public.is_workspace_owner_or_admin(workspace_uuid uuid)`

Creative Skill catalog migrations were not reached.

## Files Inspected

- `supabase/migrations/202605180007_reeditpro_rls_policies.sql`
- `supabase/migrations/202605130001_core_reeditpro_tables.sql`
- `supabase/migrations/202605130003_professional_edit_quality_engine.sql`
- `docs/creative-skills/local-migration-chain-blocker-repair-202605180007-workspace-member-function.md`
- `docs/creative-skills/implementation-handoff.md`
- `docs/creative-skills/beta-integration-merge-readiness-report.md`
- `type-contracts.md`

## Root Cause

Earlier migrations define:

```sql
create or replace function public.is_workspace_owner_or_admin(target_workspace_id uuid)
```

`202605180007_reeditpro_rls_policies.sql` attempted to replace the same function signature with a different input parameter name:

```sql
create or replace function public.is_workspace_owner_or_admin(workspace_uuid uuid)
```

PostgreSQL does not allow `create or replace function` to change the input parameter name for an existing function signature.

## Same-Class Helper Scan

The same migration was checked for workspace/project helper replacements.

- `is_workspace_member(target_workspace_id uuid)` already retained the prior parameter name from RP-BETA-INTEGRATION-12.
- `is_workspace_owner_or_admin(workspace_uuid uuid)` repeated the same-class parameter-name compatibility defect and was repaired in this pass.
- No earlier `is_project_member` or `is_project_editor` definitions were found in the scanned migrations, so those helpers were not patched as compatibility defects.
- No named-argument helper call sites were found; policy calls remain positional.

## RLS Intent

The intended owner/admin behavior is unchanged:

- Check whether `auth.uid()` has an owner/admin role in `public.workspace_members`.
- Check the newer `public.workspaces.owner_id = auth.uid()` fallback.
- Scope both checks to the provided workspace ID.
- Keep the function `security definer` with `search_path = public`.
- Preserve positional policy call sites such as `public.is_workspace_owner_or_admin(workspace_id)`.

## SQL Patch

The repair preserves the existing parameter name and updates both body references:

```sql
create or replace function public.is_workspace_owner_or_admin(target_workspace_id uuid)
...
where wm.workspace_id = target_workspace_id
...
where w.id = target_workspace_id
```

No function was dropped or recreated. No RLS policy was broadened. No permissive policy, runtime behavior, provider behavior, worker behavior, UI behavior, or app behavior was added.

## Static SQL Review

- `is_workspace_owner_or_admin` now uses `target_workspace_id`.
- The helper body uses `target_workspace_id`.
- No undefined `workspace_uuid` reference remains in the migration.
- The prior `is_workspace_member(target_workspace_id uuid)` repair remains intact.
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
- `supabase db reset --local --no-seed`: passed the repaired `is_workspace_owner_or_admin` blocker, then failed at the next migration.
- `supabase stop --project-id reeditpro-local`: passed.

Raw local command output stayed under `/tmp` and was not copied into docs.

## New Blocker

Migration:

- `supabase/migrations/202605180008_reeditpro_storage_buckets_policies.sql`

Sanitized error:

```text
must be owner of table buckets
```

Failing statement excerpt:

```sql
comment on table storage.buckets is 'ReeditPro buckets are private by default. Object paths should start with <project_id>/... for project-scoped access.'
```

Cause summary:

- The migration attempts to comment on `storage.buckets`.
- Local reset reaches this storage migration after the owner/admin helper repair.
- PostgreSQL rejects the statement because the migration role is not the owner of `storage.buckets`.

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

## Repair Decision

- `workspace_owner_admin_function_parameter_name_compatibility_repair`

## Beta Integration Status

- `blocked_not_merge_ready`

## Next Prompt

Recommended next prompt:

`RP-BETA-INTEGRATION-14 - Local Migration Chain Repair for 202605180008 Storage Buckets Policy Ownership Compatibility`

The next prompt should patch only the concrete storage bucket ownership/comment blocker in `202605180008_reeditpro_storage_buckets_policies.sql`, then rerun local-only reset.
