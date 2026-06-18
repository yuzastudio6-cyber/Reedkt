# AI Graphics Job Payload Dry-Run Runtime Gate Preconditions Owner Approval

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_owner_approved_with_warnings`

Owner-approved future preconditions:

- approved plan snapshot reference must be present and placeholder-safe
- scoped tool-call manifest reference must be present and placeholder-safe
- private artifact references and checksum placeholders must be present
- claim/lease and queue fields remain placeholders
- no public URLs, signed URLs, raw prompts, provider raw output, real user media,
  or public artifact references may be source truth
- observability/audit fields and fail-closed behavior are required

Result: `accepted_with_warnings`.
