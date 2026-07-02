# Persisted Job Runtime Handoff

Route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff`

Queue handoff route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/enqueue`

DB job type: `quality_check`

Payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`

Schema compatibility note: the persisted job must use a value that exists in the `public.job_type` enum. The GStreamer/MKVToolNix-specific identity is preserved in payload and worker metadata, not as a custom DB enum value.

Decision: `completed_gstreamer_mkvtoolnix_persisted_job_runtime_handoff`

Execution: `completed_backend_job_service_handoff_no_runtime_execution`

Confirmation gate:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true`

Handoff behavior:

- Validates approved snapshot and approval record status as `approved`.
- Builds the existing generated-fixture queue handoff payload.
- Builds the existing queued runtime route invocation body.
- Creates a job batch through the existing backend job service.
- Creates a job through the existing backend job service with the runtime invocation payload in `payloadJson`.
- Does not invoke the runtime route, dispatch a worker, claim a worker lease, run tools, run Docker, process private/user media, create signed/public artifacts, or unlock production.

Validation mode result:

- Local mock job service handoff: `passed`
- Service-role job write during validation: `not_run`
- Runtime route invocation during handoff: `false`
- GStreamer execution during handoff: `false`
- MKVToolNix execution during handoff: `false`

Readiness: `ready_for_persisted_job_runtime_route_invocation`
