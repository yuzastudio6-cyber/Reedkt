# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Build Result

Build result: `blocked_render_worker_docker_build_failed`

`TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 decision: blocked_render_worker_docker_build_failed`

Execution: `blocked_before_or_during_build`

Docker build status: `failed`

Docker image tag: `reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-21T01-12-53-067Z-3b7af8a7`

Docker push: `not_run`

Deployment: `not_run`

Required confirmation gate: `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true`

Confirmation gate status: `provided_true`

Run ID: `2026-06-21T01-12-53-067Z-3b7af8a7`

Output directory: `/tmp/reeditpro-tracka-native-container-render-tools-build-proof-3/2026-06-21T01-12-53-067Z-3b7af8a7`

Sanitized blocker summary: Docker build context transfer succeeded after sidecar cleanup, then Dockerfile COPY failed because `dist-remotion-worker`, `dist-staging-fixture-worker`, and `dist-staging-real-video-export-worker` were not present in the build context.

Report: `build-proof-3-blocked-report.json`, bytes `4460`, SHA-256 `1f45b57e9740c3355d95bf12142052302b1d070516ab3e06b64e82e091f6f058`

Manifest: `build-proof-3-blocked-manifest.json`, bytes `359`, SHA-256 `738ad586c9bd6c2fcd294a4603fb42cf48893ea232932d15707568a6a2fe2e8e`

## Confirmed Attempt Boundary

The guarded runner attempted only:

`docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-tracka-native-container-render-tools-build-proof-3:<runId> .`

The run did not push images, deploy images, use Cloud Run, use GCS/private artifacts, process media, run GStreamer pipelines, run MKVToolNix against media, run FFmpeg/FFprobe, run Remotion, execute workers/routes/providers/models, create signed/public artifacts, or unlock beta/production/final delivery.

Approved future blockers:

- `blocked_docker_daemon_unavailable`
- `blocked_render_worker_docker_build_failed`
- `blocked_metadata_install_verification_failed`

Product-ready end-to-end local OSS tools: `0`
