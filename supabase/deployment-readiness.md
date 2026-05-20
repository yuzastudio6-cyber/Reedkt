# Supabase Deployment Readiness

RP-FIX-02 status: migration order documentation is aligned with the actual local migration folder.

RP-FIX-03 status: Supabase CLI, project-link, and generated database type readiness docs exist. The CLI is still unavailable in this environment.

RP-FIX-04 status: safe deploy gate checks were rerun and deployment remained blocked before any remote command.

Deployment status: **blocked**.

## Why Deployment Is Blocked

Remote deployment is not blocked because the docs are stale anymore. It is blocked because the actual migration chain needs validation before it is safe to push.

Current blockers:

- Supabase CLI was checked and is unavailable in this environment.
- The remote project was not confirmed as exactly `reeditpro` in this task.
- Local migration validation was not run in this task.
- Remote dry-run was not run in this task.
- Remote schema backup was not attempted in this task.
- `DEPLOY_TO_REEDITPRO_SUPABASE=true` was not checked in this task.
- The local migration folder contains overlapping `20260513` and `20260518` schema chains.
- `src/backend/supabase/generated-database.types.ts` is still missing.
- The required deployment gate variables are missing.

## Required Pre-Deploy Gate

Do not deploy unless all of these are true:

1. `supabase --version` works.
2. The logged-in/project-list context confirms a project named exactly `reeditpro`.
3. The repo link is confirmed to point to the `reeditpro` project, not inferred only from `supabase/.temp/project-ref`.
4. No tracked `.env` secret files exist.
5. Local validation or disposable staging validation proves the 18 migrations apply cleanly.
6. The overlapping schema-chain risk is resolved or explicitly accepted after validation.
7. `supabase db push --dry-run` passes against the confirmed project.
8. A schema-only backup is attempted.
9. `DEPLOY_TO_REEDITPRO_SUPABASE=true` is set for the deploy shell.

## Highest-Risk Migration Area

The `202605180001` through `202605180007` migrations are high risk because they create newer overlay tables after earlier migrations have already created several of the same names.

Most important known example:

- Earlier migration: `202605130001_core_reeditpro_tables.sql` creates `public.projects` with `current_edit_plan_id`.
- Later migration: `202605180001_reeditpro_core_workspace_projects.sql` uses `create table if not exists public.projects` and expects `current_edit_session_id`.
- Risk: because the table already exists, `current_edit_session_id` may not be added, and the later FK constraint can fail.

## Readiness By Area

| Area | Status | Notes |
| --- | --- | --- |
| Migration folder inventory | Ready | 18 actual migrations listed and documented |
| Migration order docs | Ready | `migration-order.md` now matches the folder |
| Migration audit | Ready | `migration-audit.md` documents systems, tables, dependencies, and risk |
| Supabase CLI setup docs | Ready | `docs/supabase-cli-setup.md` documents install/check/login/link commands |
| Project link checklist | Ready | `project-link-readiness.md` and `reeditpro-project-confirmation-checklist.md` document required confirmation steps |
| Generated types plan | Ready | `docs/generated-database-types-plan.md` documents local and linked generation commands |
| SQL safety scan | Ready for docs | No wrong-project reference, raw secrets, `drop table`, `truncate`, or `delete from` found |
| Local validation | Blocked / not run | Requires local Supabase/Docker or staging environment |
| Remote project confirmation | Blocked / not run | Must confirm `reeditpro` before any remote command |
| Remote dry-run | Blocked / not run | Only after correct project confirmation |
| Remote deployment | Blocked | Do not deploy until gates pass |
| Generated DB types | Blocked | Plan exists; generate only after local or linked schema is available |

## RP-FIX-04 Gate Result

No Supabase link, remote migration list, dry-run, backup, push, table query, or type generation was attempted. The project is not confirmed as `reeditpro`, and `supabase/.temp/project-ref` remains untrusted as proof of project identity.

## Deployment Sequence

1. Confirm Supabase CLI.
2. Confirm project access and exact project name `reeditpro`.
3. Confirm or create safe repo link to the `reeditpro` project ref.
4. Run local validation or disposable staging validation.
5. Review the overlapping schema-chain outcome.
6. Run remote migration list and dry-run.
7. Attempt schema-only backup.
8. Deploy only with explicit gate.
9. Verify remote migration history and public tables.
10. Generate TypeScript database types.
11. Update deployment status docs.

## Still Mock-Only

The migration docs do not make the app backend-ready. These remain future work:

- Supabase client connection
- auth/profile/workspace bootstrap
- storage upload runtime
- backend API/runtime boundary
- credit purchase/spend backend
- worker queues and provider execution
- render pipeline
