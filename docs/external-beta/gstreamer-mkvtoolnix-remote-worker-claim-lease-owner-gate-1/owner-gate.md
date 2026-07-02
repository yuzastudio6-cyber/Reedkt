# Remote Worker Claim Lease Owner Gate

Owner gate: `approved_for_guarded_remote_worker_claim_lease_source_path_only`

Remote claim mode:

- `remote_supabase_worker_claim_lease_no_worker_execution`

Required gates for any future remote claim lease call:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE=true`
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE=true`
- payload field `remoteWorkerClaimLeaseConfirmed: true`
- service context with backend-only Supabase admin client
- approved snapshot reference
- persisted job id
- route idempotency key

Allowed future remote mutation scope:

- Insert a bounded worker claim lease through the existing worker claim service only.
- The result must report `supabaseMutation: worker_claim_lease_only`.

Still blocked:

- Worker dispatch.
- Worker process start.
- Worker execution.
- GStreamer execution.
- MKVToolNix execution.
- Private/user media processing.
- SQL execution outside the existing claim service RPC/read and claim insert path.
- Signed/public artifact creation.
- Final render/export.
- External beta broad unlock, paid production unlock, or production unlock.
