# Dispatch Source Gate

The source gate adds a backend-only contract for converting a proven persisted job claim into a future dispatch envelope:

- packet: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1`
- source gate mode: `dispatch_handoff_source_gate_no_worker_start`
- dispatch envelope mode: `source_gate_ready_for_confirmation_gated_dispatch_dry_run`
- next milestone: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-DRY-RUN-1`

The source gate requires:

- confirmation env: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE=true`
- PR #2155 merge SHA: `1cd82653c437bcc5082ec7b54eb4d06098554a6c`
- run ID: `2026-07-02T15-13-58-300Z-7afbfde3`
- staging project ref: `wmyyttnynmteqgcdishd`
- persisted job type: `quality_check`
- persisted payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`
- claim lease mode: `remote_supabase_worker_claim_lease_no_worker_execution`
- `claimedJobCannotBeReclaimedBeforeDispatch: true`
- `rollbackResidueVerified: true`

The source gate rejects:

- route handler invocation requests;
- worker dispatch requests;
- worker process start requests;
- worker lease mutation requests;
- GStreamer or MKVToolNix execution requests;
- media processing requests;
- Supabase/SQL mutation requests;
- signed/public artifact requests;
- beta/production/final delivery unlock requests.

The output is a metadata-only dispatch envelope. It is not a worker job, not a Cloud Run call, not a worker lease mutation, and not a media/tool runtime.
