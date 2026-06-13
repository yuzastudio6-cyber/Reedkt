# TRACK_A_RENDER_EXPORT Tool Combination Map

Decision: `track_a_render_export_tool_study_passed_docs_only`

This map describes planning combinations only. No combination in this study runs tools, starts workers, renders, exports, uploads, creates public artifacts, creates signed URLs, mutates Supabase, or processes media.

| Combination | Owned / Related Lanes | Planning Use | Required Handoff | Runtime Status |
| --- | --- | --- | --- | --- |
| Approved snapshot to final timeline | `final_timeline_assembly_planning`, `approved_plan_snapshot_v1` | Convert approved plan, timing, segment ops, and asset refs into final timeline metadata. | Approved snapshot ref, source-of-truth refs, asset manifest refs. | `blocked_no_worker_execution` |
| Track B media metadata to render readiness | `TRACK_B_MEDIA_PROCESSING`, `preview_proxy_export_qa_metadata` | Use source media dimensions, scene metadata, OCR/safe-zone notes, and artifact classes to plan export QA. | Track B metadata refs only. | `blocked_no_media_processing` |
| Sound mix metadata to final timeline | `SOUND_MUSIC_AUDIO`, `audio_video_sync_handoff_planning` | Preserve loudness, ducking, cue, and sync constraints for a future render worker. | Audio mix plan refs, cue refs, MasterTimingPlan refs. | `blocked_no_audio_processing` |
| Creative graphics metadata to layer plan | `AI_TOOLS_CREATIVE_GRAPHICS`, `overlay_graphics_placement_handoff` | Carry lower thirds, title cards, overlays, thumbnails, and brand metadata into future composition. | Private graphic asset refs, layer briefs, safe-zone notes. | `blocked_no_image_or_render_execution` |
| Caption timing to subtitle/burn-in plan | `caption_subtitle_burnin_planning`, `preview_proxy_export_qa_metadata` | Decide whether future output needs captions as sidecar, burn-in, or both. | Caption timing refs, readability policy, output frame. | `blocked_no_caption_rendering` |
| Export profile to cost/capacity metadata | `codec_quality_profile_planning`, `export_cost_capacity_metadata` | Estimate job size and capacity class for later approval. | Duration/resolution/codec placeholders. | `blocked_no_billing_or_capacity_probe` |
| Private artifact path to manifest plan | `private_gcs_path_planning`, `artifact_manifest_checksum_planning` | Define private path and checksum refs for a future worker output. | Private GCS path plan, manifest ID plan, approved snapshot ref. | `blocked_no_gcs_upload_or_manifest_write` |
| Retention policy to rollback plan | `retention_delete_rollback_planning`, `artifact_manifest_checksum_planning` | Keep delete/rollback expectations attached to future exports. | Retention class, artifact lineage, owner handoff. | `blocked_no_storage_mutation` |

## Non-Owned Routes

- `TRACK_B_MEDIA_PROCESSING` owns OpenCV, PyAV, PySceneDetect, Sharp/libvips, DuckDB, Polars, PaddleOCR, PaddlePaddle, route/capability metadata, and benchmark/sidecar metadata.
- `SOUND_MUSIC_AUDIO` owns DeepFilterNet, FFmpeg/FFprobe audio planning, AudioFlux, Signalsmith Stretch, SoundSync, SFX/music planning, and Demucs blocked review.
- `AI_TOOLS_CREATIVE_GRAPHICS` owns AI image generation planning, image editing planning, style transfer planning, graphics metadata, and creative asset QA metadata.
- `PROVIDER_GATEWAY` owns future provider/model calls.
- `WORKER_RUNTIME_JOBS` owns future worker lifecycle and job execution.
- `PUBLIC_ARTIFACT_DELIVERY` owns future public delivery and signed URL behavior.
- `SUPABASE_RLS_STORAGE_DATABASE` owns future database/storage writes and source-of-truth rows.

## Blocked Flags

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

Signed URLs are never source of truth.
