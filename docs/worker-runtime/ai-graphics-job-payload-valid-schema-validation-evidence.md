# AI Graphics Job Payload Valid Schema Validation Evidence

Decision: `worker_ai_graphics_metadata_job_payload_schema_validation_passed_with_warnings`

Result: `passed_with_warnings`

The committed valid example `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json` validated as placeholder-only metadata payload shape evidence:

- `planSnapshotId`: `<APPROVED_PLAN_SNAPSHOT_FIXTURE>`
- `scopedToolCallManifestId`: `<SCOPED_TOOL_CALL_MANIFEST_REF>`
- `privateArtifactManifestRef`: `<PRIVATE_ARTIFACT_MANIFEST_REF>`
- `checksumRef`: `<CHECKSUM_REF>`
- `claimPlaceholderRef`: `<CLAIM_PLACEHOLDER_REF>`
- `leasePlaceholderRef`: `<LEASE_PLACEHOLDER_REF>`
- `queuePlaceholderRef`: `<QUEUE_PLACEHOLDER_REF>`
- all runtime approval booleans: `false`

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
