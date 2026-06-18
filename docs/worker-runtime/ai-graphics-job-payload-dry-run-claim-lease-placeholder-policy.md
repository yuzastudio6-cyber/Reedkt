# AI Graphics Job Payload Dry-Run Claim Lease Placeholder Policy

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_approved_with_warnings`

Future dry-run validation may inspect claim/lease placeholders only. It must not claim a real job, mutate a lease, update a queue row, touch a database, or simulate success as if a live worker executed.

Allowed claim/lease evidence is metadata/static: placeholder field presence, idempotency placeholder consistency, fail-closed handling for missing placeholders, and no-execution proof. `workerJobClaimApprovedNow` is `false`; `workerLeaseMutationApprovedNow` is `false`.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
