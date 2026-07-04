# Edit Brief Supabase Future Schema Plan

Status: architecture/docs only. This report maps future `ProjectEditSession` Brief schema only and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## RP-EDITBRIEF-13 Reconciled Durable Roots

RP-EDITBRIEF-13 reconciles the ProjectEditBrief implementation to the existing durable Edit Brief/Edit Cue root model. The default future persistence target is:

- `edit_briefs`
- `edit_cues`
- `edit_cue_assets`
- `edit_cue_messages`
- `edit_cue_intents`
- `edit_cue_confirmations`
- `edit_cue_conflicts`
- `edit_cue_revisions`
- `edit_brief_application_logs`
- `edit_session_export_settings`

Earlier `project_edit_*` names are historical logical names from the architecture planning phase. They should not be used to create a parallel table family unless an owner explicitly approves a rename/migration away from the durable roots above.

## Planning Notes

- All Brief rows should scope through `edit_sessions` and the owning project/workspace access chain.
- Marker child tables should inherit session/project/workspace access policy.
- Export settings are session-level, not Brief-only.
- RLS, explicit Data API grants, service-role boundaries, Storage policy, and owner schema review remain future work.
- No migration is created.
- No generated database types are updated.
- No direct Supabase CLI command is run.

## Owner Review Required

Supabase schema timing, table shape, RLS predicates, and whether the durable Edit Cue root needs any additional columns remain pending owner/schema approval.
## RP-EDITBRIEF-03 Supabase Boundary Update

The mock repository now defines row-like shapes for future ProjectEditBrief persistence, but Supabase remains disabled. No migration was created, no direct Supabase CLI ran, no generated DB types changed, and no Supabase client/service-role/env-secret code was added.

Future schema work still requires owner approval for `edit_briefs`, `edit_cues`, marker child tables, ProjectEditSession-owned export settings, RLS/Data API grants, service-role boundaries, and remote deployment gates.

## RP-EDITBRIEF-13 Supabase Persistence Plan Status

Status: complete as a persistence plan only. The implementation remains mock/local in this PR. No Supabase migration, SQL execution, Supabase CLI command, storage operation, generated database type update, service-role env read, or remote/local database operation was run.

Next recommended milestone: `RP-EDITBRIEF-14 - Production Readiness Gates`.
