# AI Graphics Job Payload Dry-Run Scoped Manifest Evidence

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

The dry-run accepted only placeholder scoped tool-call manifest refs.

| Field | Required Value | Result |
| --- | --- | --- |
| scopedToolCallManifestId | `<SCOPED_TOOL_CALL_MANIFEST_REF>` | `passed_with_warnings` |
| scopedToolCallManifestVersion | `<SCOPED_TOOL_CALL_MANIFEST_VERSION>` | `passed_with_warnings` |

The scoped manifest remains metadata-only and does not authorize route, tool, provider, or worker runtime.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
