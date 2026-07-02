# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-DRY-RUN-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1` passes and is merged.

Required source inputs:

- #2155 remote claim/lease validation merge SHA `1cd82653c437bcc5082ec7b54eb4d06098554a6c`;
- source gate decision `completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_source_gate`;
- persisted job type `quality_check`;
- payload kind `gstreamer_mkvtoolnix_generated_fixture_runtime`;
- claim mode `remote_supabase_worker_claim_lease_no_worker_execution`;
- dispatch envelope mode `source_gate_ready_for_confirmation_gated_dispatch_dry_run`.

The dry-run packet may validate a confirmation-gated worker dispatch handoff without starting a worker process and without executing GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, media processing, signed/public artifacts, or beta/production/final delivery.

It must require a new explicit confirmation gate and must keep generated evidence local unless a later prompt explicitly authorizes remote runtime execution.
