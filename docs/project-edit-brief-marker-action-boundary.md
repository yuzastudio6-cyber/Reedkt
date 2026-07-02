# Project Edit Brief Marker Action Boundary

RP-EDITBRIEF-06 marker actions are mock/local metadata updates only.

Allowed now:
- Create marker records through the browser-safe mock client.
- Update marker metadata through the browser-safe mock client.
- Confirm marker records with mock status changes.
- Archive marker records so they are hidden from the active timeline.
- Refresh the Brief timeline, summary, and marker drawer after those mock actions.

Current mock/local follow-up actions:
- Marker Chat UI is available as marker-scoped deterministic intent capture with local fallback unless backend Qwen beta is explicitly configured.
- Metadata-only attachments are available; upload/file-byte reads remain blocked.
- Export Settings editing is available as session-level metadata; render/export remains blocked.
- Marker QA/conflict detection is available as deterministic metadata checks.
- Mock Plan Hints are available; real planner execution and edit-plan creation remain blocked.
- Real media playback or processing.
- Provider/model calls.
- Worker jobs.
- Render/progress starts.
- Credit reservation or spend.
- Remote Supabase reads/writes.

No Supabase command was run. No migration was created. Production ready: false.
