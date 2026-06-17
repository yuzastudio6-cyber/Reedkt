# AI Graphics Job Payload Blocked Use Register

Decision: `worker_ai_graphics_metadata_job_payload_shape_approved_with_warnings`

Blocked now:
- worker execution
- real job claim
- lease mutation
- queue execution
- route execution
- actual tool execution
- provider/model runtime
- browser/WebGL/canvas runtime
- `resvg` rasterization
- Remotion render/export
- Supabase mutation or SQL execution
- GCS/storage transfer
- signed URL creation
- public artifact creation
- raw prompt execution
- internal beta, external beta, paid production, and production unlock
- `dryRunPassedClaimed` claims
- `generatedLocalFixturePassedClaimed` claims

Gate-status readiness is not a dry-run pass. Validated metadata fixture templates are not actual tool outputs.
