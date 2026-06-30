# Guarded Worker Route Contract

Packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1`

Decision: `completed_gstreamer_mkvtoolnix_guarded_worker_route_implementation_negative_tests_ready_for_worker_enqueue_plan`

Execution: `completed_guarded_worker_route_contract_no_route_or_tool_execution`

Route ID: `externalBeta.gstreamerMkvtoolnix.guardedWorkerRoute`

Route path: `/api/external-beta/gstreamer-mkvtoolnix/worker/mock`

Route owner: `backend_service_role_only`

Route class: `guarded_disabled_route_contract_first`

Route status: `registered_disabled_backend_service_role_route_contract`

Next required gate: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ENQUEUE-IMPLEMENTATION-1`

## Required Contract References

- Approved plan snapshot: required.
- Approval record: required.
- Credit/no-spend policy: required.
- Job reference: required.
- Disabled worker lease: required.
- Route idempotency key: required and must match the route basis.
- Command template: required and must be one of the existing GStreamer/MKVToolNix template IDs.
- Private input manifest: required with checksum.
- Output manifest schema: required.
- QA report schema: required.
- Cleanup policy: required.
- Retention policy: required.
- Failure policy: required.
- Audit parent reference: required.

## Allowed Command Templates

- `gst_fakesrc_fakesink_no_media_healthcheck_v1`
- `gst_controlled_generated_fixture_pipeline_v1`
- `mkvmerge_generated_subtitle_only_package_v1`
- `mkvmerge_identify_generated_subtitle_only_v1`

Raw command strings allowed: `false`

## Runtime Boundary

- Route registered: `true`
- Route enabled: `false`
- Route execution: `false`
- Worker dispatch: `false`
- Worker execution: `false`
- GStreamer execution: `false`
- MKVToolNix execution: `false`
- Media processing: `false`
- Signed URL creation: `false`
- Public artifact creation: `false`
- Final render/export: `false`

This packet creates a TypeScript contract and smoke validation only. It does not create a live production HTTP route handler and does not enqueue, dispatch, execute, or process media.
