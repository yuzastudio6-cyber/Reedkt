# Track A Agent Tool-Call Architecture Support

Decision: `tracka_agent_tool_call_architecture_support_passed_three_scoped_tools_registered`

This packet records the backend architecture wiring for three scoped Track A native-container capabilities:

- `gstreamer_render_pipeline_support`
- `mkvtoolnix_container_validation`
- `gpac_mp4box_packaging_validation`

The production registry now treats these as server-side `ProductionToolId` profiles so approved agent/worker payloads can request them through `ProductionWorkerJobPayload.requestedToolIds` without failing as unknown tools.

## Agent-Facing Alias

`streamer_render_pipeline_support` is accepted only as an agent-facing typo alias for the canonical `gstreamer_render_pipeline_support` registry profile. Source-of-truth records, diagnostics, and QA packets should continue using the canonical `gstreamer_...` ID.

## Runtime Boundary

The profiles are owned by `render_worker` and modeled as `render_pipeline` capabilities. They do not authorize browser execution, arbitrary commands, raw chat execution, signed URLs as source truth, Supabase mutation, public artifacts, final render/export, or product-ready status.

Existing route contracts remain the runtime boundary:

- `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1`
- `TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1`
- `TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXECUTION-BRIDGE-1`

## User-Facing UX

The chat/frontend UX should not expose these exact tool names to normal users. User-facing cards should summarize the work as packaging/container validation, render pipeline checks, progress, blockers, and next action. Exact scoped IDs remain available in backend logs, QA reports, operator diagnostics, and developer audit surfaces.

## Safety Status

Product-ready end-to-end local OSS tools remains `0`.

Track B FFmpeg/ffprobe ownership remains preserved.

Supabase classification remains: no write / environment none / SQL none / migration no.
