# RP-INTERNAL-BETA-JOB-QUEUE-LOCAL-RUNTIME-1 Runtime Contract

Local runtime function: `createInternalBetaJobQueueLocalRuntime`

Runtime status values:
- `local_job_queue_metadata_validated_no_worker_execution`
- `blocked_invalid_job_queue_input`

Required inputs:
- `workspaceId`
- `projectId`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `idempotencyKey`
- at least one job spec with `jobType` and `workerType`

Created local-only metadata on success:
- deterministic `job_batch_<hash>` id
- deterministic local job records with `queued_metadata_only` status
- deterministic local dependency records
- deterministic local event records with `jobEventWriteExecution: false`

Blocked inputs:
- missing approved snapshot reference
- missing credit reservation reference
- missing idempotency key
- missing job type or worker type
- self-dependencies or invalid dependency indexes
- raw chat, raw prompt, provider prompt, signed/public URL, service-role, or provider secret fields
- secret-like metadata values

Job enqueue executed: `false`

Job event write executed: `false`

Worker lease claim executed: `false`

Worker heartbeat executed: `false`

Worker dispatch executed: `false`

Worker execution: `false`

Supabase persistence: `false`

Internal beta unlock: `false`
