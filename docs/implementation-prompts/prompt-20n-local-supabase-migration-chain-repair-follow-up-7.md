# Prompt 20N Local Supabase Migration Chain Repair Follow-Up 7

## Summary

Prompt 20N repairs the local-only RLS policy migration helper parameter-name blocker discovered after Prompt 20M.

- Branch: `codex/rp-foundation-20n-local-supabase-migration-chain-repair-follow-up-7`
- Base: `origin/codex/rp-foundation-20m-local-supabase-migration-chain-repair-follow-up-6`
- PR: pending
- Exact production capability enabled: `none; local-only migration chain repair`

## Allowed Scope

- Patch only `supabase/migrations/202605180007_reeditpro_rls_policies.sql`.
- Preserve existing workspace helper parameter names from earlier migrations.
- Change `is_workspace_member(workspace_uuid uuid)` to `is_workspace_member(target_workspace_id uuid)`.
- Change `is_workspace_owner_or_admin(workspace_uuid uuid)` to `is_workspace_owner_or_admin(target_workspace_id uuid)`.
- Leave project helper functions unchanged.
- Run local-only safety gates and `supabase start`.
- Record exact local validation evidence.

## Forbidden Scope

No staging Supabase, remote Supabase, production Supabase, `supabase link`, remote SQL, SQL/RLS smoke tests, provider call, rendering/export, tool execution, worker execution, production job claim, media processing, browser capture, storage transfer, signed URL creation, credit mutation, Stripe checkout/webhook/payment processing, external telemetry, deployment, production migration deployment, dependency mutation, production/beta unlock, or broad service-role handler is enabled.

## Implementation Record

Prompt 20N:

- aligned `public.is_workspace_member(uuid)` with the earlier `target_workspace_id` input parameter name;
- aligned `public.is_workspace_owner_or_admin(uuid)` with the earlier `target_workspace_id` input parameter name;
- left `public.is_project_member(project_uuid uuid)` and `public.is_project_editor(project_uuid uuid)` unchanged;
- added workflow trigger coverage for PRs targeting `codex/rp-foundation-20m-local-supabase-migration-chain-repair-follow-up-6`;
- documented the local port `54322` blocker that prevented `supabase start` from reaching the repaired migration.

## Validation Checklist

| Command | Result |
| --- | --- |
| `git diff --check` | Passed |
| `git diff --check origin/codex/rp-foundation-20m-local-supabase-migration-chain-repair-follow-up-6...HEAD` | Passed |
| `npm ci` | Passed |
| `npm run lint` | Passed |
| `npm run typecheck:server` | Passed |
| `npm run foundation:validate` | Passed |
| `npm run --silent supabase:local:toolchain:probe` | Passed; local DB URL still missing |
| `npm run --silent supabase:local:preflight` | Passed; local start allowed, local SQL blocked by missing DB URL |
| `supabase stop --no-backup` | Passed locally |
| `supabase start` | Failed before migration application because localhost port `54322` is already bound |
| `supabase status` | Not run because start failed |
| `npm run build` | Local environment-blocked by Darwin Rolldown native binding/code-signature issue |
| `npm run build:server` | Local environment-blocked by same issue |
| `npm run foundation:validate:with-build` | Completed with default checks passed and full build classified as local `environment_blocked` |

## Acceptance Result

The Prompt 20N migration blocker is repaired statically, but local migration-chain validation remains blocked before migrations by a local port conflict on `54322`. No SQL/RLS tests ran. Prompt 20O is required before the repaired migration can be validated through `supabase start`.
