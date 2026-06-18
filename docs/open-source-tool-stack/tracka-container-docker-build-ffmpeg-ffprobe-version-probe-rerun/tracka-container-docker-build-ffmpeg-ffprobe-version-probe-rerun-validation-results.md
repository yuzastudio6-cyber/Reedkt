# Validation Results

- Decision: `tracka_container_docker_build_ffmpeg_ffprobe_version_probe_rerun_passed_media_processing_still_blocked`
- Build-context regeneration passed: true
- Generated artifact scan passed: true
- Docker build command: `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-9225347e636a50aa0ef241badbf51f9a3947b1f8 .`
- FFmpeg probe command: `docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-9225347e636a50aa0ef241badbf51f9a3947b1f8 -version`
- FFprobe probe command: `docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-9225347e636a50aa0ef241badbf51f9a3947b1f8 -version`
- Supabase: no write / environment none / SQL none / migration no
