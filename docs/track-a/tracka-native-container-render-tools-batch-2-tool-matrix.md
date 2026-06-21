# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2 Tool Matrix

| scopedToolId | Batch-2 classification | install-source status | build/metadata status | identity/policy review | next milestone |
| --- | --- | --- | --- | --- | --- |
| `hyperframe_render_handoff` | `handoff_only` | `handoff_only_no_install_source_change` | `not_applicable` | `no_install_target_unless_future_source_evidence_proves_one` | `TRACKA-GSTREAMER-MKVTOOLNIX-NO-MEDIA-RUNTIME-PROOF-1` |
| `gstreamer_render_pipeline_support` | `install_source_declared` | `installed_source_declared_by_601` | `blocked_render_worker_docker_build_failed` | `not_required_for_declared_packages` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2R build-context repair and confirmed retry` |
| `bento4_mp4box_packaging_validation` | `identity_resolved_by_624` | `not_installed` | `not_run` | `resolved_mp4box_provider_gpac_ready_for_future_install_proof` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3` |
| `mkvtoolnix_container_validation` | `install_source_declared` | `installed_source_declared_by_601` | `blocked_render_worker_docker_build_failed` | `not_required_for_declared_packages` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BATCH-2R build-context repair and confirmed retry` |
| `vapoursynth_frame_pipeline` | `native_policy_resolved_by_624` | `not_installed` | `not_run` | `resolved_vapoursynth_native_policy_ready_for_future_install_proof` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3` |
| `revideo_render_preview_alternative` | `package_identity_resolved_by_624` | `not_installed` | `not_run` | `resolved_revideo_package_identity_ready_for_future_install_proof` | `TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-INSTALL-PROOF-3` |

Product-ready end-to-end local OSS tools: `0`

## Ownership Boundaries

- Atlas Track A owns only the scoped native/container render planning labels in this packet.
- FFmpeg/FFprobe remain Track B-owned shared dependencies only.
- Atlas Track A does not claim Track B media OSS tools.
- Atlas Track A does not claim AI Graphics / Worker tools.
- Atlas Track A does not claim Worker Runtime infrastructure.
- Atlas Track A does not claim Supabase schema/RLS/migrations.
- #624 is the merged source-of-truth for GPAC/MP4Box, core VapourSynth, Revideo evaluation identity, and Hyperframe handoff-only status.

## Runtime Boundary

A single local render-worker Docker build was attempted by the approved guarded runner and failed before package metadata query. No apt execution outside Docker build, package metadata query, GStreamer pipeline, MKVToolNix media command, FFmpeg/FFprobe execution, Remotion execution, worker execution, route execution, provider/model call, private media processing, signed/public artifact creation, Supabase mutation, SQL execution, or beta/production/final unlock occurred in Batch-2.
