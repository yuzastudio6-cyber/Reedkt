# Docker Container Invocation Policy

- Image source: `docker/prod/render-worker/Dockerfile`
- Existing image may be used: `false`
- Future Docker build approved: `true`
- Future build command: `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> .`
- Future FFmpeg run command: `docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version`
- Future FFprobe run command: `docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version`
- Network mode: `none`
- Image push allowed: `false`
- Dockerfile mutation allowed: `false`
- Media mounts allowed: `false`
- Output mounts allowed: `false`
- Timeout seconds: `15`
- Current phase Docker build/run: `false` / `false`
