# Track A Container FFmpeg/FFprobe Version-Probe Decision

Decision: `blocked_pending_exact_probe_command_source`

Next prompt: `OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION`

The version probes were not run. PR #481 approves the Track A render-worker/container path and the inner commands `ffmpeg -version` and `ffprobe -version`, but it does not provide an exact container invocation. Local host probing remains disallowed.
