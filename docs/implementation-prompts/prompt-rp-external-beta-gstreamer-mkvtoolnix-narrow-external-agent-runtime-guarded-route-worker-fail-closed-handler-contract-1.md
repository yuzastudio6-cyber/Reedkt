# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-1

Implement the next source-only handler contract for the disabled/backend-required narrow external-agent GStreamer/MKVToolNix route.

Prerequisites:

- `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-ROUTE-REGISTRATION-1` is merged.
- Route id `externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundaryRouteSource` remains disabled/backend-required.

Scope:

- Add only a fail-closed backend/service-role handler contract or handler-envelope source that validates approved snapshot, approval record, no-spend/credit policy, idempotency, private/generated fixture manifest, worker envelope, QA, cleanup, and audit references.
- The handler must reject or return backend-required/disabled status unless a later explicit confirmation-gated runtime packet authorizes a narrower step.
- Do not execute route handlers, dispatch workers, start worker processes, claim leases, write persistent queues, run GStreamer, run MKVToolNix, run FFmpeg/FFprobe, run Docker, run Remotion, process media, mutate Supabase, run SQL, create signed/public artifacts, or unlock beta/production/final delivery.

Expected result:

- Decision: `completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_contract`
- Execution: `completed_source_handler_contract_no_route_worker_tool_or_media_execution`
- Product-ready end-to-end local OSS tools: `0`
