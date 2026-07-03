# Exact Command Source Review

- Selected runtime path: `tracka_repo_owned_render_worker_container`
- Image tag: `reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f`
- Exact container invocation present: `true`
- Docker build command: `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f .`
- FFmpeg probe command: `docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f -version`
- FFprobe probe command: `docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f -version`
- Local host probing approved: `false`
- Media input allowed: `false`

PR #490 resolves the prior exact-command blocker with a build-then-container-version-probe path.
