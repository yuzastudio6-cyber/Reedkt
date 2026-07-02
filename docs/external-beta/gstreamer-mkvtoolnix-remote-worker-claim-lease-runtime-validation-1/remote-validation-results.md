# Remote Validation Results

Validation status: `passed`

Confirmed command:

```bash
REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_RUNTIME_VALIDATION=true \
REEDITPRO_STAGING_SUPABASE_DB_URL=<ephemeral approved staging DB URL> \
npm run rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1-confirmed
```

Decision: `completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation`

Execution: `completed_guarded_transaction_rolled_back_remote_worker_claim_lease_validation`

Run ID: `2026-07-02T15-13-58-300Z-7afbfde3`

Output directory: `/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-runtime-validation-1/2026-07-02T15-13-58-300Z-7afbfde3`

Readback:

- job type: `quality_check`
- job status: `queued`
- runtime type: `cloud_run_job`
- worker target: `render_worker`
- worker claim type: `gstreamer_mkvtoolnix_generated_fixture_worker`
- worker claim status: `active`
- `canRunBefore`: `true`
- `canClaimBefore`: `true`
- `activeClaimBefore`: `false`
- `activeClaimAfter`: `true`
- `canClaimAfter`: `false`

Rollback residue:

- workspaces: `0`
- projects: `0`
- job batches: `0`
- jobs: `0`
- worker job claims: `0`

Artifacts:

- `remote-worker-claim-lease-runtime-validation-1-report.json`, 4474 bytes, SHA-256 `52379625980493d9e0b09c1af718f2c02f6d70a1e72ed6cb2f99561c881e602d`
- `worker-claim-lease-readback.json`, 549 bytes, SHA-256 `81d764a75b875d2153c5ea96684da1d6fc5b762c5bc7376e3eb770f55f43b179`
- `rollback-residue-readback.json`, 95 bytes, SHA-256 `072535c9964d49e9c3c03b5436c35cdca2d836d3607832528bc16cdae4fbd711`
- `remote-worker-claim-lease-runtime-validation-1-manifest.json`, 1479 bytes, SHA-256 `a94f7492ba349b804238c6f24a849d82749fd48054a98eadb3d3f886c83db2d6`

The runner validates only these staging schema facts:

- generated fixture workspace/project/job batch/job rows can be inserted inside a transaction;
- persisted DB job type is `quality_check`;
- payload kind is `gstreamer_mkvtoolnix_generated_fixture_runtime`;
- `public.can_claim_worker_job(job_id)` is true before claim;
- `public.worker_job_claims` accepts one active generated fixture claim;
- `public.active_worker_claim_exists(job_id)` is true after claim;
- `public.can_claim_worker_job(job_id)` is false after claim;
- transaction rollback leaves no generated fixture residue.

No persistent rows are intended. `/tmp` report artifacts are local evidence only and must not be committed.
