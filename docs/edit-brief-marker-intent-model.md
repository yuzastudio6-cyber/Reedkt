# Edit Brief Marker Intent Model

Status: architecture/docs only. This report defines future `ProjectEditSession` Marker structured intent and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Structured Intent Fields

- `action`
- `timeRange`
- `instruction`
- `visualBehavior`
- `audioBehavior`
- `captionBehavior`
- `assetRequirement`
- `providedAssets`
- `priority`
- `confidence`
- `status`
- `blockingNeeds`
- `doNotCopyNotes`
- `plannerHints`

## Example Intents

- Add B-roll while keeping speaker audio.
- Remove awkward pause.
- Make captions smaller here.
- Use this soundtrack here.
- No fake sounds here.

## Intent History

When a user changes instructions, the future Marker Chat should preserve intent revision history. The latest confirmed intent is the planner input; older intents remain audit/history context.

## Safety

Structured intent does not execute. It becomes planning metadata only after QA/conflict checks and user confirmation.
