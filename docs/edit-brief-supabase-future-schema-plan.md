# Edit Brief Supabase Future Schema Plan

Status: architecture/docs only. This report maps future `ProjectEditSession` Brief schema only and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Tables

- `project_edit_briefs`
- `project_edit_brief_markers`
- `project_edit_brief_marker_attachments`
- `project_edit_brief_marker_messages`
- `project_edit_brief_marker_intents`
- `project_edit_brief_marker_confirmations`
- `project_edit_brief_marker_conflicts`
- `project_edit_brief_marker_revisions`
- `project_edit_brief_application_logs`
- `project_edit_session_export_settings`

## Planning Notes

- All Brief tables should scope through `project_edit_sessions`.
- Marker child tables should inherit session/project/workspace access policy.
- Export settings are session-level, not Brief-only.
- RLS, Data API grants, service-role boundaries, and owner schema review remain future work.
- No migration is created.
- No generated database types are updated.
- No direct Supabase CLI command is run.

## Owner Review Required

Supabase schema timing, table shape, RLS predicates, and whether existing Edit Cue concepts become Marker tables remain pending owner/schema approval.
## RP-EDITBRIEF-03 Supabase Boundary Update

The mock repository now defines row-like shapes for future ProjectEditBrief persistence, but Supabase remains disabled. No migration was created, no direct Supabase CLI ran, no generated DB types changed, and no Supabase client/service-role/env-secret code was added.

Future schema work still requires owner approval for `project_edit_briefs`, marker child tables, ProjectEditSession-owned export settings, RLS/Data API grants, service-role boundaries, and remote deployment gates.
