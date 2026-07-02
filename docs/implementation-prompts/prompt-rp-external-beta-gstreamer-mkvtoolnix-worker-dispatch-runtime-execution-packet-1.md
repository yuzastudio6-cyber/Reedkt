# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-PACKET-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-DRY-RUN-1` passes and is merged.

Required source inputs:

- #2158 source-gate merge SHA `488df755ef9f9954e8696ed336f9106bada06319`;
- dry-run decision `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_dry_run`;
- persisted job type `quality_check`;
- payload kind `gstreamer_mkvtoolnix_generated_fixture_runtime`;
- claim mode `remote_supabase_worker_claim_lease_no_worker_execution`;
- dry-run dispatch envelope mode `dry_run_dispatch_envelope_no_route_no_worker_start`.

Any runtime execution packet must require a new explicit confirmation gate. It must name the exact target, route, worker source, idempotency key, rollback/cleanup plan, and evidence directory. It must still preserve the boundaries against broad media, public artifacts, provider/model calls, production unlock, final delivery, and unrelated service-role handlers.
