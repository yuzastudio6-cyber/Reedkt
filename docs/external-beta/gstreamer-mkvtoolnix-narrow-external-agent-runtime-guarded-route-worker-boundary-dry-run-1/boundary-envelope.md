# Boundary Envelope

The accepted dry-run envelope validated the source boundary values without registering or executing any route or worker path.

Boundary ID: `boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1`

Proposed route ID: `externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeBoundary`

Proposed route path: `/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/runtime-boundary`

Proposed route owner: `backend_service_role_only`

Route boundary mode: `noop_validation_only`

Worker boundary mode: `not_dispatched_boundary_only`

Boundary idempotency key: `gstreamer-mkvtoolnix:narrow-external-agent-route-worker-boundary-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:gst_controlled_generated_fixture_pipeline_v1:boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1`

Allowed in this dry-run:

- Source reference validation.
- Idempotency key validation.
- Guard flag validation.
- Request/response shape validation.
- Fail-closed negative case validation.
- Local sanitized `/tmp` report and manifest creation.

Still not allowed:

- HTTP route registration or execution.
- Worker dispatch, execution, process start, lease claim, or persistent queue write.
- GStreamer/MKVToolNix execution.
- Docker, FFmpeg/FFprobe, Remotion, media processing, Supabase, SQL, signed/public artifacts, final render/export, or unlocks.
