# Supabase Connected Backend Summary

## Current Result

The backend tables are not deployed to Supabase yet.

RP-SUPABASE-02 stopped safely before remote deployment because this laptop does not currently have the Supabase CLI available, winget did not find an installable Supabase CLI package, the deployment gate variables are missing, and the linked project has not been confirmed as the real `reeditpro` project.

RP-FIX-02 aligned the migration order documentation with the actual local migration folder. The repo currently has 18 migration files. Documentation is now clearer, but deployment remains blocked until the overlapping `20260513` and `20260518` schema chains are validated or reconciled.

RP-FIX-03 added Supabase CLI setup guidance, project-link readiness docs, a `reeditpro` project confirmation checklist, generated database type generation plan, safe npm helper scripts, and local/CI deployment placeholder env variables. It did not install the CLI, link a project, deploy migrations, or generate types.

RP-FIX-04 reran the deploy gate checks and remained blocked. No remote Supabase command was run, no project was linked, no backup was attempted, no migrations were deployed, no remote tables were queried, and no generated database types were created.

## App Connection Status

The app now has a frontend-safe Supabase client factory, but product flows are still not connected to real Supabase persistence.

The frontend-safe `.env.example` placeholders exist:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` is backend-only and must never be exposed through Vite or browser code.

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are missing, `getSupabaseClient()` returns `null` and the app can remain in mock/local mode.

## Generated Types

Remote generated database types do not exist yet because deployment did not run.

Expected future generated path:

```text
src/backend/supabase/generated-database.types.ts
```

See `docs/generated-database-types-plan.md` for the local and linked generation commands. Do not create fake generated types.

`src/backend/supabase/database.types.ts` remains an honest placeholder until `generated-database.types.ts` exists.

## Still Mock-Only

- frontend editor flows
- backend service skeletons
- StoryTiming, SoundSync, SFX, render manifest, and QA mock services
- upload/media processing
- auth/profile bootstrap
- storage buckets and storage policies in real Supabase
- API routes and backend runtime
- credit purchase/spend backend
- worker orchestration
- AI/provider integrations
- render pipeline
- real Supabase-backed auth, project loading, uploads, approvals, and persistence adapters

## Migration Readiness

The migration order docs now list all 18 local files. The highest readiness risk is schema overlap:

- `20260513*` migrations create the original broad ReeditPro schema.
- `20260518*` migrations create a newer overlay schema with several duplicate table names.
- Duplicate table names include `projects`, `workspaces`, `media_assets`, `edit_plan_segments`, `credit_estimates`, `generation_requests`, `generated_assets`, `qa_reports`, and `revision_requests`.

Before deployment, run local or disposable staging validation and confirm the full chain applies cleanly.

## Required Next Milestone

Recommended next step: `RP-SUPABASE-FIX-01 - Install Supabase CLI, Confirm ReeditPro Project, Dry-Run, Deploy, Verify`. That prompt should still validate or reconcile the overlapping migration chains before any real push. After deployment and generated types, wire auth/profile and persistence adapters.
