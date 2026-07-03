# Worker Claim Lease Boundary

Route path:

`/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease`

Confirmation gate:

`REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE=true`

Claim mode:

`local_mock_claim_lease_no_worker_execution`

Worker type:

`tracka_three_tool_external_agent_generated_fixture_worker`

This packet proves a guarded, local/mock worker lease claim for the persisted approved-snapshot generated-fixture job payload. It does not dispatch a worker, start a worker process, invoke the runtime route, run tools, process media, mutate Supabase, run SQL, create public artifacts, or unlock production/final export.

Readiness after validation:

- `gstreamer_render_pipeline_support`: `external_agent_local_mock_worker_claim_lease_passed`
- `mkvtoolnix_container_validation`: `external_agent_local_mock_worker_claim_lease_passed`
- `gpac_mp4box_packaging_validation`: `external_agent_local_mock_worker_claim_lease_passed`

Next milestone: `TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-APPROVED-SNAPSHOT-EXECUTION-1`
