# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Install Metadata Verification

Metadata verification: `not_run_build_failed`

The required build confirmation `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true` was set for the single approved proof command, but the Docker build failed before any image existed to inspect.

Blocker: `blocked_render_worker_docker_build_failed`

Run ID: `2026-06-21T01-12-53-067Z-3b7af8a7`

Sanitized blocker summary: Docker build context transfer succeeded after sidecar cleanup, then Dockerfile COPY failed because `dist-remotion-worker`, `dist-staging-fixture-worker`, and `dist-staging-real-video-export-worker` were not present in the build context.

Future allowed metadata-only checks after a successful local render-worker image build:

- `dpkg-query` package database check for `gstreamer1.0-plugins-base`
- `dpkg-query` package database check for `gstreamer1.0-plugins-good`
- `dpkg-query` package database check for `gstreamer1.0-tools`
- `dpkg-query` package database check for `mkvtoolnix`
- shell `command -v gst-launch-1.0`
- shell `command -v mkvmerge`

Blocked even in a confirmed build proof:

- `gst-launch-1.0 --version`
- `mkvmerge --version`
- GStreamer pipeline execution
- MKVToolNix media execution
- FFmpeg/FFprobe execution
- Remotion execution
- media processing
- private media or GCS/private artifact access

FFmpeg/FFprobe remain Track B-owned shared dependencies only.
