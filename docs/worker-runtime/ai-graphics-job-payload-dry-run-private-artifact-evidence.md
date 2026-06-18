# AI Graphics Job Payload Dry-Run Private Artifact Evidence

Decision: `worker_ai_graphics_metadata_job_payload_dry_run_passed_with_warnings`

The dry-run accepted only private artifact/checksum placeholders.

| Field | Required Value | Result |
| --- | --- | --- |
| privateArtifactManifestRef | `<PRIVATE_ARTIFACT_MANIFEST_REF>` | `passed_with_warnings` |
| privateArtifactScope | `private_placeholder_only` | `passed_with_warnings` |
| checksumRef | `<CHECKSUM_REF>` | `passed_with_warnings` |

Signed URLs and public artifacts remain outside the source-of-truth path.

No worker execution, job claim, lease mutation, queue execution, route execution, actual tool execution, provider/model runtime, browser/WebGL/canvas runtime, resvg rasterization, Remotion render/export, Supabase mutation, SQL execution, GCS/storage transfer, signed URL creation, public artifact creation, raw prompt execution, internal beta unlock, external beta unlock, production unlock, or broad service-role handler was enabled.
