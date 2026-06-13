# TRACK_A_RENDER_EXPORT Handoff Contract

Decision: `track_a_render_export_tool_study_passed_docs_only`

This contract defines metadata that later route and worker phases may consume. It does not authorize worker, tool, route, provider, render, export, GCS, Supabase, public artifact, signed URL, beta, or production execution.

## Required Future Input

| Field | Source Owner | Notes |
| --- | --- | --- |
| `approvedPlanSnapshotRef` | Model orchestration / product approval | Required before any future worker phase. Raw prompts and candidate snapshots are not valid inputs. |
| `sourceOfTruthRefs` | `SUPABASE_RLS_STORAGE_DATABASE` and private artifact owners | Supabase row refs, private manifest IDs, checksums, and private GCS path refs only. Signed URLs are never source of truth. |
| `trackBMediaMetadataRefs` | `TRACK_B_MEDIA_PROCESSING` | Source dimensions, safe zones, OCR, scene, media QA, and data metadata refs. |
| `soundMusicAudioRefs` | `SOUND_MUSIC_AUDIO` | Audio mix, loudness, cue, music, SFX, and sync metadata refs. |
| `creativeGraphicsRefs` | `AI_TOOLS_CREATIVE_GRAPHICS` | Lower-third, title-card, overlay, thumbnail, poster, style, and graphic QA metadata refs. |
| `outputFrameAndTimingBase` | Approved plan snapshot | Aspect ratio/output frame and timing base must already be confirmed. |
| `artifactScopePolicy` | Worker/runtime and source-of-truth owners | Private output class, retention class, rollback plan, and delivery owner. |

## Future Output Metadata

- `final_timeline_assembly_planning`
- `render_export_planning`
- `mux_transcode_container_planning`
- `codec_quality_profile_planning`
- `caption_subtitle_burnin_planning`
- `overlay_graphics_placement_handoff`
- `audio_video_sync_handoff_planning`
- `preview_proxy_export_qa_metadata`
- `artifact_manifest_checksum_planning`
- `private_gcs_path_planning`
- `retention_delete_rollback_planning`
- `export_cost_capacity_metadata`
- `final_export_route_capability_metadata`

## Blocked Runtime Contract

- routeExecutionAllowed: false
- runtimeExecutionAllowed: false
- workerExecutionAllowed: false
- providerExecutionAllowed: false
- toolExecutionAllowed: false
- renderExecutionAllowed: false
- exportExecutionAllowed: false
- mediaProcessingAllowed: false
- publicArtifactsAllowed: false
- signedUrlsAsSourceOfTruthAllowed: false
- rawPromptExecutionAllowed: false

Future worker phases must use `approved_plan_snapshot_v1` or a later approved snapshot contract. They must not use raw chat, raw prompts, provider responses, unapproved candidates, signed URLs, or public artifacts as source-of-truth input.

## Supabase Classification

- Supabase update required: `no write`
- Supabase environment touched: `none`
- SQL executed: `none`
- Migration deployed: `no`
