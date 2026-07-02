# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-RUNTIME-VALIDATION-1 Results

Decision: `completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation`

Execution: `completed_guarded_transaction_rolled_back_remote_worker_claim_lease_validation`

Target: `Reeditpro / wmyyttnynmteqgcdishd / staging`

DB job type: `quality_check`

Payload kind: `gstreamer_mkvtoolnix_generated_fixture_runtime`

Schema compatibility: `db_job_type_uses_public_job_type_enum_payload_kind_preserves_gstreamer_mkvtoolnix_runtime_identity`

Run ID: `2026-07-02T15-13-58-300Z-7afbfde3`

Output directory: `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/2026-07-02T15-13-58-300Z-7afbfde3`

Validation: `passed`

Readback: `quality_check` queued job, `render_worker`, `cloud_run_job`, `gstreamer_mkvtoolnix_generated_fixture_worker`, `canRunBefore=true`, `canClaimBefore=true`, `activeClaimAfter=true`, `canClaimAfter=false`

Rollback residue: `workspaces=0`, `projects=0`, `jobBatches=0`, `jobs=0`, `workerJobClaims=0`

Artifacts/checksums:

- `remote-worker-claim-lease-runtime-validation-1-report.json`, 4474 bytes, SHA-256 `52379625980493d9e0b09c1af718f2c02f6d70a1e72ed6cb2f99561c881e602d`
- `worker-claim-lease-readback.json`, 549 bytes, SHA-256 `81d764a75b875d2153c5ea96684da1d6fc5b762c5bc7376e3eb770f55f43b179`
- `rollback-residue-readback.json`, 95 bytes, SHA-256 `072535c9964d49e9c3c03b5436c35cdca2d836d3607832528bc16cdae4fbd711`
- `remote-worker-claim-lease-runtime-validation-1-manifest.json`, 1479 bytes, SHA-256 `a94f7492ba349b804238c6f24a849d82749fd48054a98eadb3d3f886c83db2d6`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Next milestone: `RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1`

No Supabase mutation outside the guarded rollback transaction, Secret Manager payload access by the runner, provider call, model call, worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, FFmpeg/FFprobe execution, Docker execution, Remotion execution, private media processing, user media processing, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, external beta broad unlock, paid production unlock, production unlock, raw prompt execution, final render/export, package installation beyond dependency validation, dependency mutation, package-lock mutation, or broad service-role handler is enabled.
