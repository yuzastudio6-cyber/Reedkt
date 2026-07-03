# Approved Snapshot Job Route Contract

This packet validates a backend route request/response envelope for the approved-snapshot job lane without registering or executing a production route.

Contract:
- Route path: `/api/internal-beta/tracka/gstreamer-mkvtoolnix/approved-snapshot-jobs/dry-run`
- Route method: `POST`
- Request body carries only approved snapshot ID, job ID, idempotency key, source QA evidence reference, artifact manifest reference, and cleanup policy reference.
- Response body accepts the contract and returns the next worker-lease no-op milestone.

Tool readiness:
- `gstreamer_render_pipeline_support`: `ready_for_approved_snapshot_worker_lease_noop`
- `mkvtoolnix_container_validation`: `ready_for_approved_snapshot_worker_lease_noop`
- `gpac_mp4box_packaging_validation`: `blocked_pending_package_source_install_proof`

Route/write behavior:
- Route registration: `false`
- Route execution: `false`
- Service-role secret access: `false`
- Persistent job queue write: `false`
- Real worker dispatch: `false`
- Worker execution: `false`
- Worker lease claim: `false`
- Tool execution: `false`

Next milestone: `TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-WORKER-LEASE-NOOP-1`
