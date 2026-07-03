# TRACK_A_RENDER_EXPORT Internal Beta Gap Map

Decision: `track_a_render_export_tool_study_passed_docs_only`

This study makes render/export planning gaps visible for future internal-readiness review. It does not unlock internal beta, external beta, paid production, production, render/export runtime, public delivery, signed URLs, Supabase writes, or worker execution.

| Gap | Owner | Current Status | Required Future Packet |
| --- | --- | --- | --- |
| Approved snapshot intake to render worker | `WORKER_RUNTIME_JOBS` and `TRACK_A_RENDER_EXPORT` | Metadata-only handoff defined; no worker execution. | Worker/runtime route dry-run approval and execution packet. |
| Final timeline assembly validation | `TRACK_A_RENDER_EXPORT` | Planning metadata only. | Synthetic route validation, then worker dry-run. |
| Remotion render worker boundary | `WORKER_RUNTIME_JOBS` | No render worker started. | Separate render worker approval and dry-run. |
| Mux/transcode/container execution | `TRACK_A_RENDER_EXPORT` and worker owner | No FFmpeg or transcoder execution. | Tool/worker execution approval with command allowlist. |
| Caption/subtitle/burn-in output | `TRACK_A_RENDER_EXPORT` | Plan only; no subtitle or burn-in file generated. | Render/export worker approval. |
| Private artifact manifest/checksum write | `SUPABASE_RLS_STORAGE_DATABASE`, storage owner, worker owner | Plan only; no manifest row or object write. | Supabase/storage/worker source-of-truth execution approval. |
| Private GCS path materialization | Storage owner | Private path planning only. | GCS upload/storage approval. |
| Public delivery/download | `PUBLIC_ARTIFACT_DELIVERY` | Blocked. | Separate public delivery approval; signed URLs are never source of truth. |
| Retention/delete/rollback execution | Storage and Supabase owners | Plan only. | Separate storage/database cleanup approval. |
| Export cost/capacity evidence | Worker/runtime owner | Estimate metadata only. | Capacity and billing review before runtime. |

## Current Beta Status

- internalBetaUnlockAllowed: false
- externalBetaUnlockAllowed: false
- paidProductionUnlockAllowed: false
- productionUnlockAllowed: false
- renderExecutionAllowed: false
- exportExecutionAllowed: false
- workerExecutionAllowed: false
- routeExecutionAllowed: false
- publicArtifactsAllowed: false
- signedUrlsAsSourceOfTruthAllowed: false

All TOOL-STUDY-0 owner studies are complete only after `tool-study:track-a-render-export:diagnostics` passes. Tool-route execution remains blocked pending a separate route execution gate.
