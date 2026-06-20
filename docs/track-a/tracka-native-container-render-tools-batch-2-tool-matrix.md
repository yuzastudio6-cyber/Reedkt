# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 Tool Matrix

| scopedToolId | Batch-2 classification | install-source status | build/metadata status | identity/policy review | next milestone |
| --- | --- | --- | --- | --- | --- |
| `hyperframe_render_handoff` | `handoff_only` | `handoff_only_no_install_source_change` | `not_applicable` | `no_install_target_unless_future_source_evidence_proves_one` | `TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1` |
| `gstreamer_render_pipeline_support` | `install_source_declared` | `installed_source_declared_by_601` | `blocked_pending_native_container_build_confirmation` | `not_required_for_declared_packages` | `TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1` |
| `bento4_mp4box_packaging_validation` | `identity_review_required` | `not_installed` | `not_run` | `blocked_pending_bento4_mp4box_package_identity_provenance_review` | `TRACKA-BENTO4-MP4BOX-PACKAGE-IDENTITY-RESOLUTION-1` |
| `mkvtoolnix_container_validation` | `install_source_declared` | `installed_source_declared_by_601` | `blocked_pending_native_container_build_confirmation` | `not_required_for_declared_packages` | `TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1` |
| `vapoursynth_frame_pipeline` | `native_policy_review_required` | `not_installed` | `not_run` | `blocked_pending_vapoursynth_native_dependency_plugin_policy` | `TRACKA-VAPOURSYNTH-NATIVE-POLICY-RESOLUTION-1` |
| `revideo_render_preview_alternative` | `package_identity_review_required` | `not_installed` | `not_run` | `blocked_pending_revideo_package_identity_review` | `TRACKA-REVIDEO-PACKAGE-IDENTITY-RESOLUTION-1` |

Product-ready end-to-end local OSS tools: `0`

## Ownership Boundaries

- Atlas Track A owns only the scoped native/container render planning labels in this packet.
- FFmpeg/FFprobe remain Track B-owned shared dependencies only.
- Atlas Track A does not claim Track B media OSS tools.
- Atlas Track A does not claim AI Graphics / Worker tools.
- Atlas Track A does not claim Worker Runtime infrastructure.
- Atlas Track A does not claim Supabase schema/RLS/migrations.

## Runtime Boundary

No Docker build, apt execution, package metadata query, GStreamer pipeline, MKVToolNix media command, FFmpeg/FFprobe execution, Remotion execution, worker execution, route execution, provider/model call, private media processing, signed/public artifact creation, Supabase mutation, SQL execution, or beta/production/final unlock occurred in Batch-2.
