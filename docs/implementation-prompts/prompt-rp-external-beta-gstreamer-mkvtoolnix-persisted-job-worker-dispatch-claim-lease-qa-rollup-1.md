# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-WORKER-DISPATCH-CLAIM-LEASE-QA-ROLLUP-1

Goal: invoke the guarded persisted generated-fixture worker claim-lease route once with local/mock runtime context, then record sanitized evidence that the lease boundary works without worker execution.

Required route:

- `/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease`

Required confirmation:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE=true`

Expected success:

- `completed_persisted_job_worker_claim_lease_boundary`
- `completed_local_mock_claim_only`
- worker dispatch `false`
- worker execution `false`
- remote worker claim `false`
- Supabase mutation `false`
- SQL execution `false`

Do not run GStreamer, MKVToolNix, FFmpeg/FFprobe, Docker, Remotion, workers, private/user media, public artifact flows, final export, Supabase mutation, SQL, provider/model calls, paid-production unlock, or production unlock.
