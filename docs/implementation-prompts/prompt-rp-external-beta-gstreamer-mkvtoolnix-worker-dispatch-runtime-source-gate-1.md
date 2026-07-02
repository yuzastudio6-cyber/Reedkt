# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1

Use only after `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-RUNTIME-VALIDATION-1` passes.

Required source inputs:

- validated DB job type `quality_check`;
- payload kind `gstreamer_mkvtoolnix_generated_fixture_runtime`;
- staging target `Reeditpro / wmyyttnynmteqgcdishd / staging`;
- rollback proof that generated job claim rows leave no residue;
- proof that worker claim makes `can_claim_worker_job` false before dispatch.

This next packet may plan the source gate for dispatch handoff only. It must not start workers, execute GStreamer, execute MKVToolNix, process media, create public artifacts, mutate production, or unlock beta/production/final delivery unless a later explicit confirmation-gated runtime packet authorizes the exact path.
