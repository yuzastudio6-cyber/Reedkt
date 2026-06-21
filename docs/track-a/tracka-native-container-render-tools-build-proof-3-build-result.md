# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Build Result

Build result: `blocked_render_worker_docker_build_failed`

`TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 decision: blocked_render_worker_docker_build_failed`

Execution: `blocked_before_or_during_build`

Docker build status: `failed`

Docker image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-21T00-41-00-745Z-1884537d`

Docker push: `not_run`

Deployment: `not_run`

Required confirmation gate: `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true`

Confirmation gate status: `provided_true`

Run ID: `2026-06-21T00-41-00-745Z-1884537d`

Output directory: `/tmp/reeditpro-tracka-native-container-render-tools-build-proof-3/2026-06-21T00-41-00-745Z-1884537d`

Sanitized blocker summary: Docker build failed while sending the build context: `failed to xattr dist-server/._brand: operation not permitted`.

Report: `build-proof-3-blocked-report.json`, bytes `2810`, SHA-256 `4341ddf9e211a52a158079eccbab9ce65a8bba2dfabcfe78b215d1f65d2459ef`

Manifest: `build-proof-3-blocked-manifest.json`, bytes `359`, SHA-256 `acdf39f6db38edd831174458ac183c9738b59d86a2e262b4f43070fb850637f5`

## Confirmed Attempt Boundary

The guarded runner attempted only:

`docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-tracka-native-container-render-tools-build-proof-3:<runId> .`

The run did not push images, deploy images, use Cloud Run, use GCS/private artifacts, process media, run GStreamer pipelines, run MKVToolNix against media, run FFmpeg/FFprobe, run Remotion, execute workers/routes/providers/models, create signed/public artifacts, or unlock beta/production/final delivery.

Approved future blockers:

- `blocked_docker_daemon_unavailable`
- `blocked_render_worker_docker_build_failed`
- `blocked_metadata_install_verification_failed`

Product-ready end-to-end local OSS tools: `0`
