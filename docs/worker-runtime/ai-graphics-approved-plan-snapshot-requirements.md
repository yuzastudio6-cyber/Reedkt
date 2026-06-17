# AI Graphics Approved Plan Snapshot Requirements

Decision: `worker_ai_graphics_metadata_handoff_approved_with_warnings`

Future Worker Runtime payload planning must require an approved plan snapshot placeholder before any AI graphics metadata handoff can be accepted.

## Requirements

- `planSnapshotId` must be a placeholder in docs and fixtures: `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`.
- The snapshot must reference the accepted metadata-only tool and capability id.
- The snapshot must preserve blocked runtime uses for browser/WebGL/canvas, actual tool execution, route execution, worker execution, provider runtime, resvg rasterization, Remotion render/export, Supabase mutation, GCS upload, signed URLs, public artifacts, raw prompts, beta, and production.
- The snapshot must not be replaced by raw prompt text, public artifact links, signed URLs, or provider raw output.
