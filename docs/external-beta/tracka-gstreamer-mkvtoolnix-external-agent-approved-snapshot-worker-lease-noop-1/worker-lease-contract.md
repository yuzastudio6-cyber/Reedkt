# Approved Snapshot Worker Lease Contract

This packet validates the worker-facing lease envelope without claiming a persistent lease or starting a worker.

Contract:
- Worker lane: `tracka_gstreamer_mkvtoolnix_external_agent_generated_fixture`
- Approved snapshot ID: `approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1`
- Job ID: `job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1`
- Source route idempotency key: `edd9e5a10252c85e8f0b34867b08dad5c6f4a10fc2fa3038a278678911fe330b`

Tool readiness:
- `gstreamer_render_pipeline_support`: `ready_for_external_agent_approved_snapshot_job_execution`
- `mkvtoolnix_container_validation`: `ready_for_external_agent_approved_snapshot_job_execution`
- `gpac_mp4box_packaging_validation`: `blocked_pending_package_source_install_proof`

Worker behavior:
- Persistent job queue write: `false`
- Persistent lease claim: `false`
- Real worker dispatch: `false`
- Worker process start: `false`
- Worker execution: `false`
- Tool execution: `false`

Next milestone: `TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1`
