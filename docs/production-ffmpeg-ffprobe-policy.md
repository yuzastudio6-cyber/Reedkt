# Production FFmpeg And FFprobe Policy

FFmpeg and FFprobe are controlled worker tools. They are not frontend tools, provider tools, user command surfaces, or raw shell wrappers.

## Allowed Milestone 6 Use

- FFprobe metadata probing with JSON output.
- FFmpeg H.264 MP4 proxy creation.
- FFmpeg mono 16kHz WAV audio extraction.
- FFmpeg bounded JPEG keyframe extraction.
- FFmpeg bounded JPEG representative-frame extraction.

## Safety Rules

- Use Node `child_process.execFile`, not shell command strings.
- Use allowlisted adapter options only.
- Do not accept raw FFmpeg args from user chat or frontend payloads.
- Reject raw URLs, signed URLs, path traversal, and output paths outside the safe temp/storage root.
- Do not overwrite source media.
- Use command timeouts and bounded output buffers.
- Do not assume GPL or nonfree FFmpeg flags.

## License Boundary

FFmpeg remains LGPL-safe by policy until legal/build review approves the exact production build. Milestone 6 does not install FFmpeg, build images, deploy workers, or validate production codec licensing.

## Milestone 10 Install Declaration

Milestone 10 Dockerfiles may declare distro FFmpeg/ffprobe packages for future CPU/render/QA/readiness images. This supports human-built readiness images, not Codex host installation or final legal approval.

M10 readiness checks are limited to `ffmpeg -version`, `ffprobe -version`, and safe subtitle support inspection. They must not process media or claim commercial LGPL compliance.
