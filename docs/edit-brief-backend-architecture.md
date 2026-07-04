# Edit Brief Backend Architecture

Status: architecture/docs only. This report adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Backend Entities

| Entity | Purpose | Relationship to `ProjectEditSession` | Future repository | Future API route | Durable Supabase root | Mock-only phase |
| --- | --- | --- | --- | --- | --- | --- |
| `ProjectEditBrief` | Brief container for timeline instructions. | One session may own one or more briefs. | Yes, later. | Yes, later. | `edit_briefs` | RP-EDITBRIEF-03+ |
| `ProjectEditBriefMarker` | Time/range instruction. | Belongs to brief and session. | Yes, later. | Yes, later. | `edit_cues` | RP-EDITBRIEF-03+ |
| `ProjectEditBriefMarkerAttachment` | Metadata-only asset link. | Belongs to marker. | Yes, later. | Yes, later. | `edit_cue_assets` | RP-EDITBRIEF-08+ |
| `ProjectEditBriefMarkerMessage` | Raw Marker Chat message. | Belongs to marker and session. | Yes, later. | Yes, later. | `edit_cue_messages` | RP-EDITBRIEF-07+ |
| `ProjectEditBriefMarkerIntent` | Structured intent from note/chat. | Belongs to marker. | Yes, later. | Yes, later. | `edit_cue_intents` | RP-EDITBRIEF-07+ |
| `ProjectEditBriefMarkerConfirmation` | Confirmation/approval metadata. | Belongs to marker. | Yes, later. | Yes, later. | `edit_cue_confirmations` | RP-EDITBRIEF-07+ |
| `ProjectEditBriefMarkerConflict` | QA/conflict result. | Belongs to marker/session. | Yes, later. | Yes, later. | `edit_cue_conflicts` | RP-EDITBRIEF-10+ |
| `ProjectEditBriefMarkerRevision` | Intent/note change history. | Belongs to marker. | Yes, later. | Yes, later. | `edit_cue_revisions` | RP-EDITBRIEF-07+ |
| `ProjectEditBriefApplicationLog` | Planner application audit. | Belongs to brief/session. | Yes, later. | Yes, later. | `edit_brief_application_logs` | RP-EDITBRIEF-11+ |
| `ProjectEditSessionExportSettings` | Session-level delivery settings. | Belongs to session, accessible from Chat and Brief. | Yes, later. | Yes, later. | `edit_session_export_settings` | RP-EDITBRIEF-09+ |

## Reuse

Future work should follow existing Project Edit Session repository/API/client/mock safety patterns. RP-EDITBRIEF-13 reconciles the ProjectEditBrief type names to existing durable Edit Brief/Edit Cue roots rather than creating a parallel `project_edit_*` table family by default.
