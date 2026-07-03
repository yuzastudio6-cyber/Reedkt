# FFmpeg / FFprobe Binary Approval

- `FFmpeg`: future check-only command `command -v ffmpeg && ffmpeg -version`
- `FFprobe`: future check-only command `command -v ffprobe && ffprobe -version`

- NPM wrapper selected: `false`
- Repo package mutation planned: `false`
- Docker/container mutation planned in this lane: `false`
- Current phase system binary install attempted: `false`
- Current phase version probe attempted: `false`
- Absence handling: future execution must fail closed if binaries are absent unless a separate worker/container owner approval supplies binaries
