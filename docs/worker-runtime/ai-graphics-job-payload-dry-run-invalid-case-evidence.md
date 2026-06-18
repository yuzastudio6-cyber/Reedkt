# AI Graphics Job Payload Dry-Run Invalid Case Evidence

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

The invalid fixture `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.invalid.json` was accepted with warnings because it remains placeholder-only and fail-closed for malformed metadata refs.

| Check | Result |
| --- | --- |
| expected invalid reason | `missing_scoped_manifest_and_checksum_placeholders` |
| missing scoped manifest placeholder | `<MISSING_SCOPED_TOOL_CALL_MANIFEST_REF>` |
| missing checksum placeholder | `<MISSING_CHECKSUM_REF>` |
| signed URL fail-closed assertion | `passed_with_warnings` |
| runtime approvals false | `passed_with_warnings` |
| scoped pass claim | `workerAiGraphicsMetadataJobPayloadDryRunPassed` |

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
