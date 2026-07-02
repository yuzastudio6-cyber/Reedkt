# Persisted Job Worker Claim Lease Boundary

Route: `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease`

Confirmation gate: `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE=true`

Mode: `local_mock_claim_lease_no_worker_execution`

Worker type: `gstreamer_mkvtoolnix_generated_fixture_worker`

Accepted input:

- Approved snapshot reference from the persisted generated-fixture runtime payload.
- Persisted job ID from the generated-fixture payload.
- Route idempotency key derived from workspace, project, approved snapshot, persisted job, persisted invocation, and worker instance.
- Lease expiry timestamp.

Accepted result:

- Status: `completed_persisted_job_worker_claim_lease_boundary`
- Worker lease claim: `completed_local_mock_claim_only`
- Remote worker claim: `false`
- Worker dispatch: `false`
- Worker execution: `false`
- Tool execution: `false`
- GStreamer execution: `false`
- MKVToolNix execution: `false`
- Supabase mutation: `false`
- SQL execution: `false`

This milestone intentionally validates the lease boundary only. It does not start a worker process, claim a remote Supabase lease, execute route runtime, run GStreamer/MKVToolNix, process media, or create artifacts.
