# Pre-Execution Validation

Probe execution validation passed: `true`

Exact commands:
- `docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f .`
- `docker run --rm --network none --entrypoint ffmpeg reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f -version`
- `docker run --rm --network none --entrypoint ffprobe reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f -version`
