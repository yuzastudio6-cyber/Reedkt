# RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-RUNTIME-VALIDATION-1

Run only after the owner gate source path has merged and a valid persisted worker job exists in the approved ReEditPro Supabase project.

Required gates:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE=true`

Allowed action:

- Invoke the persisted claim-lease route once with `claimLeaseMode=remote_supabase_worker_claim_lease_no_worker_execution` and `remoteWorkerClaimLeaseConfirmed=true`.

Still forbidden:

- Worker dispatch, worker execution, worker process start, GStreamer execution, MKVToolNix execution, private/user media processing, signed/public artifacts, final render/export, broad external beta unlock, paid production unlock, and production unlock.
