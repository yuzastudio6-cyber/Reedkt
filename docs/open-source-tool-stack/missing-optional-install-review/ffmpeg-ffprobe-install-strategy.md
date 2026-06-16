# FFmpeg / FFprobe Install Strategy

- `FFmpeg`: `blocked_missing_system_binary`, future binary `ffmpeg`
- `FFprobe`: `blocked_missing_system_binary`, future binary `ffprobe`

- Install class: `system_binary_or_worker_container_layer`
- NPM wrapper selected: `false`
- Package-lock mutation expected in future approval: `false`
- Future proof scope: version probes only after separate system-binary/container approval; no media input or output
- License policy: LGPL-safe FFmpeg configuration review required before production use
