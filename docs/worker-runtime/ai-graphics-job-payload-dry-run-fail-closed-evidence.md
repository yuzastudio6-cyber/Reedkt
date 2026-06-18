# AI Graphics Job Payload Dry-Run Fail-Closed Evidence

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

The dry-run requires fail-closed assertions before any runtime path.

| Assertion | Result |
| --- | --- |
| `blocked_if_plan_snapshot_missing` | `passed_with_warnings` |
| `blocked_if_scoped_manifest_missing` | `passed_with_warnings` |
| `blocked_if_runtime_requested` | `passed_with_warnings` |
| `blocked_if_public_artifact_requested` | `passed_with_warnings` |
| `blocked_if_signed_url_requested` | `passed_with_warnings` for invalid case |

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
