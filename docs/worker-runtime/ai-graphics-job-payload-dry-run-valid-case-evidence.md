# AI Graphics Job Payload Dry-Run Valid Case Evidence

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

The valid fixture `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.valid.json` was accepted with warnings for the local/static metadata dry-run.

| Check | Result |
| --- | --- |
| payload fields present | `passed_with_warnings` |
| planSnapshotId | `<APPROVED_PLAN_SNAPSHOT_FIXTURE>` |
| scopedToolCallManifestId | `<SCOPED_TOOL_CALL_MANIFEST_REF>` |
| privateArtifactManifestRef | `<PRIVATE_ARTIFACT_MANIFEST_REF>` |
| checksumRef | `<CHECKSUM_REF>` |
| claimPlaceholderRef | `<CLAIM_PLACEHOLDER_REF>` |
| leasePlaceholderRef | `<LEASE_PLACEHOLDER_REF>` |
| queuePlaceholderRef | `<QUEUE_PLACEHOLDER_REF>` |
| scoped pass claim | `workerAiGraphicsMetadataJobPayloadDryRunPassed` |

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
