# Edit Brief Marker Model

Status: architecture/docs only. This report defines the future `ProjectEditSession` Marker model and adds no implementation, no TypeScript types, no repository, no API route, no UI route, no runtime behavior, no migration, no Supabase command, no provider/model call, no worker, no render, no upload, no file-byte read, no credit action, no staging, and no cleanup.

## Future Marker Fields

- `briefId`
- `markerId`
- `projectId`
- `editSessionId`
- `startTimeSeconds`
- `endTimeSeconds` optional
- `markerType`
- `title`
- `userNote`
- `priority`
- `status`
- `attachedAssetCount`
- `aiMode`
- `intentStatus`
- `createdAt`
- `updatedAt`
- `mockOnly`

## Starter Marker Types

`broll`, `cut_remove`, `keep_emphasize`, `caption_text`, `graphic_card_ui`, `music_soundtrack`, `sfx_sound_design`, `voiceover`, `transition`, `speed_pacing`, `color_tone`, `do_not_use`, `general_note`.

## Starter Marker Statuses

`draft`, `needs_clarification`, `needs_asset`, `confirmed`, `ready_for_plan`, `conflict`, `applied_to_plan`, `changed_after_plan`, `archived`.

## Marker Priority

`must_follow`, `should_follow`, `optional`, `avoid`.

## Marker AI Modes

`off`, `confirm_only`, `ask_clarifying_questions`, `suggest_options`.

Recommended default: `confirm_only`, with owner approval pending. No Qwen or provider call is enabled.

## RP-EDITBRIEF-06 Implementation Note

The marker model is now represented in the mock/local Brief drawer. Users can create and update marker type, priority, point/range timing, title, note, status, and AI mode metadata through browser-safe client calls. Confirm sets status to `confirmed`; archive hides the marker from the active lane.

This remains metadata only: no Marker Chat, attachment upload, QA/conflict detection, planner application, render/progress, provider/model call, worker, credits, migration, or Supabase command.
