# Project Edit Brief Marker Next Chat Flow

RP-EDITBRIEF-06 deliberately stops before Marker Chat.

Recommended next milestone: RP-EDITBRIEF-07 - Marker Chat + Intent Capture.

RP-EDITBRIEF-07 should add marker-scoped conversation only after owner review. It should keep Marker Chat distinct from the main Edit Chat stream and should continue to treat Edit Brief markers as structured instruction metadata, not execution.

Expected future work:
- Open Marker Chat for one selected marker.
- Store marker-scoped messages.
- Summarize marker conversation into structured marker intent.
- Keep main Edit Chat separate, with optional future summary events only.
- Preserve do-not-copy and no-execution boundaries.

Still blocked until later milestones:
- Attachment upload.
- Export editing.
- QA/conflict detection.
- Planner application.
- Render/progress/workers/credits.
- Supabase persistence and migrations.

No Supabase command was run for RP-EDITBRIEF-06. No migration was created. Production ready: false.
