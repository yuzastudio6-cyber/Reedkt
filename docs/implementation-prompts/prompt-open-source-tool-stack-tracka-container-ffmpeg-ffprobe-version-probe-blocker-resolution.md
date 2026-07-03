# OPEN_SOURCE_TOOL_STACK_TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_BLOCKER_RESOLUTION

Resolve the exact container invocation blocker before running any FFmpeg/FFprobe version probes.

Current decision: `blocked_pending_exact_probe_command_source`

Required source update:
- Provide the exact approved Track A container command(s) that execute only `ffmpeg -version` and `ffprobe -version`.
- State whether Docker build/run is approved, and if so provide the exact bounded command.
- Preserve no media input, no media probing, no decode/encode, no caption burn-in, no render/export, no Dockerfile/container mutation, no image push, and no public artifact or signed URL behavior.

Do not fall back to local host binaries.
