# TRACK_A_RENDER_EXPORT Capability Map

Decision: `track_a_render_export_tool_study_passed_docs_only`

Status: `complete_for_TRACK_A_RENDER_EXPORT_owner_study`

| Capability ID | Purpose | Strengths | Weaknesses / Bad Fits | Inputs | Outputs | Evidence-Backed Readiness | Blocked Runtime Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `final_timeline_assembly_planning` | Assemble approved segment, layer, timing, caption, audio, and asset refs into a final timeline plan. | Makes dependency gaps visible before worker execution. | Not a real Remotion render or worker queue. | Approved snapshot ref, segment ops, MasterTimingPlan, asset manifest refs. | Timeline assembly metadata, dependency map, hold reason. | Metadata-ready from approved snapshot and asset manifest policies. | `blocked_no_render_or_worker_execution` |
| `render_export_planning` | Decide future render path, preview/proxy path, export target, and QA gates. | Keeps output frame, timing base, and quality checks explicit. | Cannot verify output until a later render worker runs. | Approved frame, render strategy, timeline metadata, QA thresholds. | Render plan metadata, export plan metadata, QA checklist. | Planning-ready. | `blocked_no_render_execution` |
| `mux_transcode_container_planning` | Plan future container, stream, mux, and transcode settings. | Keeps codec/container risks visible before export. | Does not run FFmpeg or inspect binary output. | Platform target, stream metadata, audio mix refs, captions. | Container plan, mux plan, transcode risk notes. | Metadata-only. | `blocked_no_mux_or_transcode_execution` |
| `codec_quality_profile_planning` | Plan bitrate, codec, resolution, frame rate, and delivery quality profiles. | Connects edit level and platform needs to export profiles. | Cannot measure true output size, encoder speed, or visual artifacts. | Output frame, platform, quality tier, cost/capacity class. | Codec profile plan, cost/capacity metadata. | Metadata-only. | `blocked_no_export_execution` |
| `caption_subtitle_burnin_planning` | Plan caption track, subtitle sidecar, and burn-in handoff. | Keeps readability, safe zones, and frame-accurate timing constraints explicit. | Does not generate subtitle files or burn captions into video. | Caption timing refs, layout safe zones, output frame. | Caption export plan, subtitle sidecar plan, burn-in decision metadata. | Planning-ready. | `blocked_no_caption_rendering` |
| `overlay_graphics_placement_handoff` | Consume approved lower-third, title, overlay, and creative graphics placement metadata. | Keeps graphics timing, z-order, and safe-zone constraints visible. | Does not generate or composite graphics. | AI creative graphics refs, Remotion layer briefs, safe-zone policy. | Overlay handoff metadata and collision risks. | Depends on AI owner study evidence. | `blocked_no_graphics_execution` |
| `audio_video_sync_handoff_planning` | Consume audio mix, cue, loudness, and sync metadata for final timeline planning. | Protects speech clarity and timing alignment. | Does not process audio or mux audio tracks. | Sound/Music/Audio handoff, MasterTimingPlan, source sync refs. | Audio/video sync plan and drift risks. | Depends on Sound owner study evidence. | `blocked_no_audio_processing` |
| `preview_proxy_export_qa_metadata` | Shape future preview/proxy/export QA checks. | Captures playback, duration, frame, audio, caption, manifest, and checksum checks. | Does not create previews, proxies, or exports. | Timeline plan, quality profile, manifest refs. | QA metadata and failure categories. | Metadata-ready. | `blocked_no_public_or_private_output_creation` |
| `artifact_manifest_checksum_planning` | Define private artifact manifest IDs, checksums, and lineage refs. | Enforces source-of-truth discipline for future worker output. | Does not hash real files or write manifests. | Approved snapshot ref, planned artifact refs, retention policy. | Manifest plan, checksum plan, lineage map. | Planning-ready. | `blocked_no_file_or_manifest_write` |
| `private_gcs_path_planning` | Plan private GCS path classes for future worker artifacts. | Keeps storage scope private and non-public. | Does not call GCS, upload objects, or create signed URLs. | Project/private bucket refs, artifact class, retention policy. | Private path plan and bucket-owner handoff. | Metadata-only. | `blocked_no_gcs_upload` |
| `retention_delete_rollback_planning` | Plan retention, delete, rollback, and cleanup metadata for future artifacts. | Makes cleanup and recovery responsibilities explicit. | Does not delete, rollback, or mutate storage/database state. | Artifact classes, privacy tier, lifecycle policy. | Retention/delete/rollback plan. | Metadata-only. | `blocked_no_storage_or_db_mutation` |
| `export_cost_capacity_metadata` | Estimate future render/export cost and capacity class without probing infrastructure. | Helps future approval packets bound job size and cost. | Not billing, not credit mutation, not capacity probe. | Duration class, resolution, codec profile, timeline complexity. | Cost/capacity route metadata. | Metadata-only. | `blocked_no_billing_or_runtime` |
| `final_export_route_capability_metadata` | Define future route capability fields without enabling a route. | Gives TOOL-ROUTE and worker owners a stable handoff. | Not a route handler and not runtime execution. | Approved snapshot ref, route policy, artifact policy. | Route capability metadata. | Metadata-only. | `blocked_no_route_execution` |

## Global Flags

- routeExecutionAllowed: false
- runtimeExecutionAllowed: false
- workerExecutionAllowed: false
- providerExecutionAllowed: false
- modelExecutionAllowed: false
- toolExecutionAllowed: false
- renderExecutionAllowed: false
- exportExecutionAllowed: false
- mediaProcessingAllowed: false
- publicArtifactsAllowed: false
- signedUrlsAsSourceOfTruthAllowed: false

Signed URLs are never source of truth.
