# RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-LOCAL-RUNTIME-1 Runtime Contract

Local runtime function: `createInternalBetaRemotionPrivatePreviewExportLocalRuntime`

Runtime status values:
- `local_remotion_private_preview_export_metadata_validated_no_render_execution`
- `blocked_invalid_remotion_private_preview_export_input`

Required inputs:
- `workspaceId`
- `projectId`
- `approvedPlanSnapshotId`
- `creditReservationId`
- `jobId`
- `artifactManifestId`
- `rendererPlanId`
- `idempotencyKey`
- positive output frame width, height, fps, and duration frames
- at least one private preview/export output expectation with file name, byte count, and SHA-256 checksum

Created local-only metadata on success:
- deterministic `remotion_private_render_request_<hash>` id
- deterministic private preview/export output expectation metadata
- checksum records copied from supplied SHA-256 values
- QA gate metadata with `qaExecution: false`
- cleanup policy metadata with `cleanupExecuted: false`

Blocked inputs:
- missing approved snapshot/job/credit reservation/artifact manifest/renderer plan/idempotency references
- missing or malformed checksums
- path-like file names
- invalid output frame values
- raw chat, raw prompt, provider prompt, signed/public URL, media bytes, rendered bytes, service-role, provider secret, or secret-like metadata

Worker dispatch: `false`

Worker execution: `false`

Remotion execution: `false`

FFmpeg execution: `false`

FFprobe execution: `false`

Media processing: `false`

Render/export execution: `false`

Preview artifact creation: `false`

Final export creation: `false`

Storage write: `false`

Storage read: `false`

Signed URL creation: `false`

Public artifact creation: `false`

Internal beta unlock: `false`
