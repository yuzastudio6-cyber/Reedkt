# Project Edit Brief Export Settings Next QA Conflicts

RP-EDITBRIEF-10 now implements Marker QA and Conflict Detection as mock/local deterministic metadata. The next recommended milestone after owner review is RP-EDITBRIEF-11, focused on applying QA-passed Brief markers to future edit-plan metadata.

## Handoff Inputs

- Export Settings panel can now expose platform, aspect, resolution, frame rate, caption safe area, safe zone, format, codec, audio codec, and delivery preset as mock/local metadata.
- Marker QA compares confirmed or draft markers against Export Settings safe areas and delivery constraints.
- Conflict checks flag marker instructions that contradict selected session-level export metadata.
- QA remains metadata-only and does not apply markers to plans.

## Still Blocked

RP-EDITBRIEF-10 remains mock/local unless separately approved. It must not start render/export, file bytes, URL fetch, media processing, Supabase command, providers, workers, credits, production execution, Qwen, DeepSeek, sound runtime, Docker, or planner application.

Boundary phrase: no render/export, no file bytes, no URL fetch, no media processing, no Supabase command.
