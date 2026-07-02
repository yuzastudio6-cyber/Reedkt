# Project Edit Brief Export Settings Policy

RP-EDITBRIEF-09 keeps Export Settings as deterministic planning metadata.

## Allowed Now

- Read existing session-level mock Export Settings.
- Recommend a preset from declared platform/aspect metadata.
- Save user override metadata through the existing mock route/client/repository seam.
- Preserve caption safe area and safe-zone metadata for future planner use.

## Blocked Now

- Real render/export execution.
- FFmpeg/FFprobe/media probing.
- File-byte reads, uploads, signed URLs, and external URL fetches.
- Supabase command, migration, remote read, or remote write.
- Provider/model calls, workers, credits, and production route behavior.

The policy is mock/local and reportable only. Export Settings do not authorize timeline planning, render, delivery, or billing.

owner review remains required before any production Export Settings behavior, render/export runtime, media probing, or persistence work. Boundary phrase: no render/export, no file bytes, no URL fetch, no media processing, no Supabase command.
