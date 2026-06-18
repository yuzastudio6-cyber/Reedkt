# AI Graphics Job Payload Invalid Schema Validation Evidence

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings`

Result: `passed_with_warnings`

The committed invalid example `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.invalid.json` validated as fail-closed invalid-case evidence with `expectedInvalidReason` set to `missing_scoped_manifest_and_checksum_placeholders`.

Invalid-case validation confirms the placeholder-only missing manifest/checksum case is treated as rejection evidence and not as a worker payload. The fixture contains no URL, signed URL marker, public artifact ref, raw prompt text, secret, real user data, provider raw output, or executable instruction.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
