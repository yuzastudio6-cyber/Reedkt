# Narrow Guarded Route/Worker Boundary Contract

Boundary status: `ready_for_confirmation_gated_narrow_route_worker_boundary_noop_dry_run`

Route boundary mode: `noop_validation_only`

Worker boundary mode: `not_dispatched_boundary_only`

Future dry-run gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN=true`

Proposed route ID: `externalBeta.gstreamerMkvtoolnix.narrowExternalAgentRuntimeBoundary`

Proposed route path: `/api/external-beta/gstreamer-mkvtoolnix/narrow-agent/runtime-boundary`

Proposed route owner: `backend_service_role_only`

Route registered in this packet: `false`

Route enabled in this packet: `false`

Route execution in this packet: `false`

Worker dispatch in this packet: `false`

Worker execution in this packet: `false`

Worker process start in this packet: `false`

Worker lease claim in this packet: `false`

Persistent job queue write in this packet: `false`

Boundary idempotency key:

`gstreamer-mkvtoolnix:narrow-external-agent-route-worker-boundary-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1:gst_controlled_generated_fixture_pipeline_v1:boundary-gstreamer-mkvtoolnix-narrow-external-agent-route-worker-1`

The contract composes the already-reviewed narrow bridge validator. If bridge validation fails, the route/worker boundary fails closed with `blocked_narrow_bridge_validation_failed`.
