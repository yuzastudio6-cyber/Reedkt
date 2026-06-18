# AI Graphics Job Payload Dry-Run Runtime Gate Preconditions

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_ready_with_warnings`

Required future gate preconditions:

- Approved plan snapshot placeholder: `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`.
- Scoped tool-call manifest placeholder: `<SCOPED_TOOL_CALL_MANIFEST_REF>`.
- Private artifact manifest placeholder: `<PRIVATE_ARTIFACT_MANIFEST_REF>`.
- Checksum placeholder: `<CHECKSUM_REF>`.
- Claim/lease placeholders only; no job claim or lease mutation.
- Queue placeholders only; no queue execution.
- No public URLs, signed URLs as source truth, raw prompt payloads, provider raw outputs, real user media, or executable runtime instructions.
