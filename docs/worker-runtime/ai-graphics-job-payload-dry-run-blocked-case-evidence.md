# AI Graphics Job Payload Dry-Run Blocked Case Evidence

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

The blocked fixture `docs/worker-runtime/fixtures/ai-graphics-metadata-job-payload-example.blocked.json` was accepted with warnings because it fails closed before runtime for unsafe or out-of-scope inputs.

| Check | Result |
| --- | --- |
| expected blocked reason | `fail_closed_before_execution` |
| missing or unapproved plan snapshot placeholder | `passed_with_warnings` |
| out-of-scope manifest placeholder | `passed_with_warnings` |
| runtime approvals false | `passed_with_warnings` |
| scoped pass claim | `workerAiGraphicsMetadataJobPayloadDryRunPassed` |

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
