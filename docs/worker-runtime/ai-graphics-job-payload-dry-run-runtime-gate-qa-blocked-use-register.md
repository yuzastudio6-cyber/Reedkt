# AI Graphics Job Payload Dry-Run Runtime Gate QA Blocked-Use Register

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_runtime_gate_qa_passed_with_warnings`

Blocked uses remain:

- live worker execution
- real job claim
- lease mutation
- queue execution
- route execution
- actual tool execution
- provider/model runtime
- browser/WebGL/canvas runtime
- resvg rasterization
- Remotion render/export
- Supabase mutation
- SQL execution
- GCS/storage transfer
- signed URL creation
- public artifact creation
- raw prompt execution
- internal beta unlock
- external beta unlock
- production unlock
- broad service-role handler

Result: `accepted_with_warnings`.
