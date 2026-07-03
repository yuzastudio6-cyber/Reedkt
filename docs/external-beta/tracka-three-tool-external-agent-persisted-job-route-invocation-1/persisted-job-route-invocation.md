# Persisted Job Route Invocation

Route path:

`/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-invoke`

Confirmation gates:

- `REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION=true`
- `REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION=true`

The route invocation reads the local/mock persisted job handoff payload and delegates to the already confirmed approved-snapshot generated-fixture runtime packet. It does not create a persistent queue write, claim a worker lease, dispatch a worker, execute a worker process, mutate Supabase, run SQL, access private media, create signed/public artifacts, or unlock final export.

The generated-fixture runtime delegate is still bounded to controlled generated fixtures for:

- GStreamer
- MKVToolNix
- GPAC/MP4Box

Readiness after a passing invocation:

- `gstreamer_render_pipeline_support`: `external_agent_persisted_job_route_invocation_passed`
- `mkvtoolnix_container_validation`: `external_agent_persisted_job_route_invocation_passed`
- `gpac_mp4box_packaging_validation`: `external_agent_persisted_job_route_invocation_passed`

Next milestone: `TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-DISPATCH-CLAIM-LEASE-1`
