# RP-INTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-LOCAL-RUNTIME-1 Source Audit

Decision: `completed_local_remotion_private_preview_export_runtime_no_render_execution`

Execution: `completed_backend_local_remotion_preview_export_validation_no_render_or_media`

Source chain:
- `remotion-renderer-plan.md` keeps Remotion as the controlled compositor and renderer layer, but blocks render execution before approval, timing, asset, QA, and worker gates.
- `approved-plan-snapshot-policy.md` requires future workers to execute approved snapshots, not raw chat.
- `editing-asset-manifest.md` requires future preview/export assets to be tracked in an asset manifest before downstream use.
- `RP-RENDER-01-INTERNAL-BETA-REMOTION-RENDER-WORKER-SCAFFOLD` provided fail-closed render-worker operation names only.
- `RP-INTERNAL-BETA-PRIVATE-ARTIFACT-MANIFEST-LOCAL-RUNTIME-1` provides deterministic local private artifact manifest/checksum/QA/cleanup metadata.
- `RP-INTERNAL-BETA-JOB-QUEUE-LOCAL-RUNTIME-1` provides deterministic local job queue metadata.
- `RP-INTERNAL-BETA-CREDIT-RESERVATION-LOCAL-RUNTIME-1` provides deterministic local credit reservation metadata.
- `RP-INTERNAL-BETA-APPROVED-SNAPSHOT-PERSISTENCE-LOCAL-RUNTIME-1` validates local approved snapshot records.
- #577 remains open/draft/blocked and excluded as source-of-truth.

This packet adds deterministic local Remotion private preview/export request metadata, private output expectation metadata, checksum validation, QA-gate metadata, and cleanup-policy metadata. It does not dispatch workers, execute Remotion, run FFmpeg/FFprobe, process media, create previews, create exports, write storage, read storage, create signed URLs, create public artifacts, mutate Supabase, or unlock internal beta.

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
