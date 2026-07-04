# Edit Brief Real Video Timeline Sync

Status: RP-MEDIA-01 browser timeline sync. Local browser preview only. No upload, no backend file bytes, no worker, no media processing, no render, no credits, no provider/model call, no Supabase command, and no migration are authorized.

## Sync Model

When a local source video is selected, the Brief timeline uses browser video duration and current time:

- `durationSeconds` comes from `HTMLVideoElement.duration`
- `playheadSeconds` follows `HTMLVideoElement.currentTime`
- timeline width maps `0` to `durationSeconds`
- clicking the timeline seeks the browser video
- video `timeupdate` moves the timeline playhead

Timeline clicks only seek playback. They do not create markers.

## Marker Defaults

Add Marker remains the explicit marker creation action. It uses the active playhead:

- point marker start defaults to current browser playback time
- range marker end defaults to `min(currentTime + 3, durationSeconds)`

Existing marker edit, update, confirm, archive, Marker Chat, QA, attachments, and plan-hint behavior remains mock/local.
