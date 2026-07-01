# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PACKET-1

## Summary

Continue from `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PLAN-1`.

Run only if the confirmation gate is explicitly present:

`REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_EXECUTION=true`

The allowed execution is a local guarded route-handler invocation metadata check only. It may validate that the route handler accepts the approved fixture envelope and rejects unsafe requests. It must not start a worker process, claim a worker lease, write a persistent job queue, execute GStreamer, execute MKVToolNix, process media, mutate Supabase, run SQL, create signed/public artifacts, or unlock external beta broadly.

## Required Source Chain

- PR #1929 route-dispatch dry run: `completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_dry_run_metadata_only`
- PR #1925 route-dispatch readiness: `completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_readiness_for_confirmation_gated_dry_run`
- PR #1921 runtime QA rollup
- PR #1918 runtime execution packet
- PR #1905 agent dispatch dry run
- PR #1902 queue integration
- PR #577 remains open/draft/blocked/excluded

## Allowed Scope

- Validate approved snapshot reference.
- Validate approval record reference.
- Validate no-spend fixture policy.
- Validate route-dispatch execution idempotency key.
- Validate private input manifest reference.
- Validate output manifest and QA report schema references.
- Validate cleanup, retry, and non-public artifact policy references.
- Return sanitized local route-dispatch metadata only.

## Forbidden Scope

- Worker process start.
- Worker lease claim.
- Persistent job queue write.
- GStreamer execution.
- MKVToolNix execution.
- FFmpeg/FFprobe execution.
- Docker execution.
- Remotion execution.
- Private/user media processing.
- Supabase mutation or SQL execution.
- Secret payload access.
- Signed URL or public artifact creation.
- Final render/export.
- Broad external beta, paid production, or production unlock.

## Expected Decisions

If the guarded local route-handler invocation metadata check passes:

- Decision: `completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_packet_metadata_only`
- Execution: `completed_confirmation_gated_local_route_handler_invocation_metadata_only_no_worker_or_tool_execution`
- Next milestone: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-DISPATCH-EXECUTION-PACKET-1`

If it fails, record exactly one blocker and keep the PR draft.
