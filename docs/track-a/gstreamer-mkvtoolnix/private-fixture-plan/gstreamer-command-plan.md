# GStreamer Command Plan

Status: `planned_no_execution`

Allowed future command class: `bounded_synthetic_generated_source_pipeline`

Preferred future command family: `gst-launch-1.0 -q videotestsrc num-buffers=3 ! fakesink`

This phase defines command scope only. GStreamer execution: `not_run`

## Future Requirements

- Docker network disabled where possible.
- Bounded generated synthetic source only.
- No private/user media.
- No real-media decode.
- No FFmpeg/FFprobe.
- Safe stdout only.
- No file output by default.
- Cleanup required for any temp directory created by the future proof.

## Disallowed

Private/user media decode, real media decode, FFmpeg/FFprobe, render/export, broad media processing, public artifact delivery, signed URL delivery, beta, and production remain disallowed.
