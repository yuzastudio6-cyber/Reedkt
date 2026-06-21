# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Install Metadata Verification

Metadata verification: `not_run_build_failed`

The required build confirmation `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true` was set for the single approved proof command, but the Docker build failed before any image existed to inspect.

Blocker: `blocked_docker_build_context_transfer_failed`

Run ID: `2026-06-21T02-12-41-704Z-a06117f3`

Raw runner decision before blocker normalization: `blocked_render_worker_docker_build_failed`

Prebuilt worker outputs: `present_generated_by_safe_build_scripts_not_committed`

Sanitized blocker summary: prebuilt worker outputs were generated and present, but Docker build context transfer failed on root AppleDouble sidecar `._dist-remotion-worker`: `failed to xattr ._dist-remotion-worker: operation not permitted`.

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
