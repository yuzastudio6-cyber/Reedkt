# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-1 Tool Matrix

| scopedToolId | upstream tool | owner | duplicate status | install status | implementation status | runtime lane | install feasibility | next milestone |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `hyperframe_render_handoff` | Hyperframe | Atlas Track A | `no_duplicate_found` | `planned_only` | `implementation_partial` | `planning_only` | `handoff_metadata_only_no_install` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2` |
| `gstreamer_render_pipeline_support` | GStreamer | Atlas Track A | `no_duplicate_found` | `not_installed` | `implementation_missing` | `cpu_native_container_worker` | `candidate_docker_install_path_only` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2` |
| `bento4_mp4box_packaging_validation` | Bento4 / MP4Box | Atlas Track A | `no_duplicate_found` | `not_installed` | `implementation_missing` | `cpu_native_container_worker` | `blocked_pending_package_identity_and_provenance_review` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2` |
| `mkvtoolnix_container_validation` | MKVToolNix | Atlas Track A | `no_duplicate_found` | `not_installed` | `implementation_missing` | `cpu_native_container_worker` | `candidate_docker_install_path_only` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2` |
| `vapoursynth_frame_pipeline` | VapourSynth | Atlas Track A | `no_duplicate_found` | `not_installed` | `implementation_missing` | `cpu_native_container_worker` | `blocked_pending_native_dependency_plugin_review` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2` |
| `revideo_render_preview_alternative` | Revideo | Atlas Track A | `no_duplicate_found` | `not_installed` | `implementation_missing` | `cpu_render_worker` | `blocked_pending_revideo_package_identity_review` | `TRACKA-REVIDEO-PACKAGE-IDENTITY-REVIEW-1` |

## Notes

- Hyperframe has metadata bridge/source evidence only; no Hyperframe runtime package install is claimed.
- GStreamer, Bento4/MP4Box, MKVToolNix, VapourSynth, and Revideo remain not installed.
- Revideo remains evaluation-only and production-blocked.
- Product-ready end-to-end local OSS tools: `0`
