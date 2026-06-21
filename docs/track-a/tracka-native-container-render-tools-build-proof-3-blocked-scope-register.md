# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Blocked Scope Register

Build proof blocker: `blocked_docker_build_context_transfer_failed`

Required gate status: `provided_true`

Run ID: `2026-06-21T02-12-41-704Z-a06117f3`

Raw runner decision before blocker normalization: `blocked_render_worker_docker_build_failed`

Prebuilt worker outputs: `present_generated_by_safe_build_scripts_not_committed`

Sanitized blocker summary: prebuilt worker outputs were generated and present, but Docker build context transfer failed on root AppleDouble sidecar `._dist-remotion-worker`: `failed to xattr ._dist-remotion-worker: operation not permitted`.

Blocked scope in this packet:

- Docker image inspection
- Docker build completion
- Docker push
- Cloud Run
- deployment
- media processing
- runtime media execution
- GStreamer pipeline execution
- MKVToolNix media execution
- FFmpeg/FFprobe execution
- Remotion execution
- browser capture
- private media
- GCS/private artifact access
- signed URL creation
- public artifact creation
- Supabase mutation
- SQL execution
- worker execution
- route execution
- provider/model calls
- internal beta unlock
- external beta unlock
- production unlock
- final render/export
- package-lock mutation

Resolved identity/policy, still blocked from install or runtime execution in this packet:

- `bento4_mp4box_packaging_validation`: `resolved_mp4box_provider_gpac_ready_for_future_install_proof`
- `vapoursynth_frame_pipeline`: `resolved_vapoursynth_native_policy_ready_for_future_install_proof`
- `revideo_render_preview_alternative`: `resolved_revideo_package_identity_ready_for_future_install_proof`, evaluation-only/non-core
- `hyperframe_render_handoff`: `handoff_only_no_build_change`
