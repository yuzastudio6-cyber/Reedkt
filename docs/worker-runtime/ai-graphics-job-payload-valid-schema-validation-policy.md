# AI Graphics Job Payload Valid Schema Validation Policy

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_approved_with_warnings`

Future validation may accept only payloads matching `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json`.

Required valid-case checks:
- Placeholder `planSnapshotId` equals `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`.
- Placeholder `scopedToolCallManifestId` equals `<SCOPED_TOOL_CALL_MANIFEST_REF>`.
- Private artifact and checksum refs remain `<PRIVATE_ARTIFACT_MANIFEST_REF>` and `<CHECKSUM_REF>`.
- `blockedRuntimeFlags` entries remain `false`.
- `noExecutionProof` stays metadata/static only.

No schema validation execution, worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
