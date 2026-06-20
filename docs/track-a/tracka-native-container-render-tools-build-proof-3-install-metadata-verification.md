# TRACKA-NATIVE-CONTAINER-RENDER-TOOLS-BUILD-PROOF-3 Install Metadata Verification

Metadata verification: `not_run_confirmation_absent`

The required build confirmation `REEDITPRO_CONFIRM_TRACKA_NATIVE_CONTAINER_BUILD_PROOF=true` was not set, so the packet did not inspect any image or execute metadata checks.

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
