# Exact Future Probe Commands

The blocker is resolved by defining exact future commands only. This phase did not run them.

- Build command template: `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> .`
- FFmpeg run command template: `docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version`
- FFprobe run command template: `docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-<source-sha> -version`
- Resolved current-source build command: `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-31dbf3d26c18 .`
- Resolved current-source FFmpeg command: `docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-31dbf3d26c18 -version`
- Resolved current-source FFprobe command: `docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-31dbf3d26c18 -version`
- Local host probing reason: PR #481 selected the Track A repo-owned render-worker/container path and explicitly blocked local host probing.
- No media reason: Commands use only version flags and have no media path arguments or mounts.
- Current phase Docker/probe execution: `false` / `false` / `false`
