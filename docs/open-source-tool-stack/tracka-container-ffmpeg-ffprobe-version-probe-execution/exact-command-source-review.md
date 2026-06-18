# Exact Command Source Review

Decision: `blocked_pending_exact_probe_command_source`

- Selected runtime path: `tracka_repo_owned_render_worker_container`
- Approved inner commands: `ffmpeg -version`, `ffprobe -version`
- Exact container invocation present: `false`
- Docker build approved by source: `false`
- Docker run approved by source: `false`
- Local host probing approved: `false`

The packet stops before FFmpeg/FFprobe version probes because PR #481 does not define an exact container command. The approved inner commands are not enough to infer Docker build/run mechanics.
