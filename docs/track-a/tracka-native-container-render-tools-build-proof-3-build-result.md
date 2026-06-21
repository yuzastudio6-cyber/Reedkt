# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Build Result

Build result: `blocked_docker_build_context_transfer_failed`

`TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 decision: blocked_docker_build_context_transfer_failed`

Execution: `blocked_before_or_during_build`

Docker build status: `failed`

Docker image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-21T02-12-41-704Z-a06117f3`

Docker push: `not_run`

Deployment: `not_run`

Required confirmation gate: `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true`

Confirmation gate status: `provided_true`

Run ID: `2026-06-21T02-12-41-704Z-a06117f3`

Output directory: `/tmp/reeditpro-tracka-native-container-render-tools-build-proof-3/2026-06-21T02-12-41-704Z-a06117f3`

Raw runner decision before blocker normalization: `blocked_render_worker_docker_build_failed`

Prebuilt worker outputs: `present_generated_by_safe_build_scripts_not_committed`

Missing prebuilt output blocker: `blocked_missing_prebuilt_worker_outputs`

Sanitized blocker summary: prebuilt worker outputs were generated and present, but Docker build context transfer failed on root AppleDouble sidecar `._dist-remotion-worker`: `failed to xattr ._dist-remotion-worker: operation not permitted`.

Report: `build-proof-3-blocked-report.json`, bytes `2963`, SHA-256 `17f1cc020b1a2e58fcafc89c4addaa3dbf629c3b54da0d39ef02731d74a6529a`

Manifest: `build-proof-3-blocked-manifest.json`, bytes `359`, SHA-256 `70c83f50c07603574791a692c6b90729a0df612818e853d0f5d44860ef763b2c`

## Confirmed Attempt Boundary

The guarded runner attempted only:

`docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-tracka-native-container-render-tools-build-proof-3:<runId> .`

The run did not push images, deploy images, use Cloud Run, use GCS/private artifacts, process media, run GStreamer pipelines, run MKVToolNix against media, run FFmpeg/FFprobe, run Remotion, execute workers/routes/providers/models, create signed/public artifacts, or unlock beta/production/final delivery.

Approved future blockers:

- `blocked_docker_daemon_unavailable`
- `blocked_docker_build_context_transfer_failed`
- `blocked_render_worker_docker_build_failed`
- `blocked_metadata_install_verification_failed`

Product-ready end-to-end local OSS tools: `0`
