# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-2 Tool Matrix

| scopedToolId | upstream tool | owner | duplicate status | install-source status | runtime lane | runtime status | next milestone |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `hyperframe_render_handoff` | Hyperframe | Atlas Track A | `no_duplicate_found` | `handoff_only_no_install_source_change` | `planning_only` | `not_run` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3` |
| `gstreamer_render_pipeline_support` | GStreamer | Atlas Track A | `no_duplicate_found` | `install_source_added_pending_docker_build_proof` | `cpu_native_container_worker` | `not_run` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3` |
| `bento4_mp4box_packaging_validation` | Bento4 / MP4Box | Atlas Track A | `no_duplicate_found` | `blocked_pending_bento4_mp4box_package_identity_provenance_review` | `cpu_native_container_worker` | `not_run` | `TRACKA-BENTO4-MP4BOX-PACKAGE-IDENTITY-REVIEW-1` |
| `mkvtoolnix_container_validation` | MKVToolNix | Atlas Track A | `no_duplicate_found` | `install_source_added_pending_docker_build_proof` | `cpu_native_container_worker` | `not_run` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3` |
| `vapoursynth_frame_pipeline` | VapourSynth | Atlas Track A | `no_duplicate_found` | `blocked_pending_vapoursynth_native_dependency_plugin_policy` | `cpu_native_container_worker` | `not_run` | `TRACKA-VAPOURSYNTH-NATIVE-POLICY-REVIEW-1` |
| `revideo_render_preview_alternative` | Revideo | Atlas Track A | `no_duplicate_found` | `blocked_pending_revideo_package_identity_review` | `cpu_render_worker` | `not_run` | `TRACKA-REVIDEO-PACKAGE-IDENTITY-REVIEW-1` |

Product-ready end-to-end local OSS tools: `0`

## Notes

- GStreamer and MKVToolNix have source declarations only; they are ready for a future Docker build proof.
- Hyperframe remains handoff/planning only.
- Bento4/MP4Box, VapourSynth, and Revideo remain blocked until their package identity, provenance, native/plugin policy, or ownership questions are resolved.
- No runtime execution occurred for any row.
