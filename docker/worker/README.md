# ReeditPro Worker Dev Image

This folder contains the local/dev/test worker image for RP-E2E readiness checks. It is not a production-approved media worker image.

The image installs:

- Node 22
- npm dependencies from the repo lockfile
- FFmpeg and FFprobe
- Python 3 and pip
- small shell utilities for smoke checks

It does not install provider SDKs, Remotion, Sharp/libvips, Playwright browsers, AudioFlux, OpenCV, VapourSynth plugins, Signalsmith Stretch, Stripe, Google Cloud credentials, or secrets.

## Build

```bash
npm run docker:worker:build
```

This builds `reeditpro-worker-dev` from `docker/worker/Dockerfile`.

## Tool Checks

```bash
npm run docker:worker:tools
npm run docker:worker:smoke
```

These commands run the same server-only readiness checks used by local development, but inside the worker image.

Strict Prompt 6 readiness:

```bash
docker run --rm \
  --env API_ALLOW_MOCK_WITHOUT_SUPABASE=true \
  --env E2E_RUNTIME_MODE=local \
  --env WORKER_RUNTIME_MODE=local \
  --env STRICT_PROMPT6_TOOL_READINESS=true \
  reeditpro-worker-dev npm run smoke:prompt6-ready
```

Basic render smoke inside Docker:

```bash
npm run docker:worker:render-smoke
```

This runs the local FFprobe/FFmpeg preview smoke only. It does not run Remotion or upload/download real media.

## Interpreting Results

Prompt 6 requires only:

- `ffmpeg`
- `ffprobe`

If both are `available` in `npm run tools:summary` or the strict Docker smoke test, Prompt 6 can run basic media-readiness smoke tests. Missing host tools are acceptable when the Docker worker tools pass.

Optional tools stay unavailable until their own milestones:

- Remotion and Sharp/libvips for compositor/image worker milestones.
- AudioFlux, OpenCV, VapourSynth, Playwright, and Signalsmith Stretch for dedicated audio, QA, frame, capture, or stretch milestones.

## Production Caveat

The FFmpeg package in this image is for local/dev/test readiness only. Production FFmpeg and codec usage still needs LGPL-safe build/configuration review, codec/patent review, and deployment review before real customer media work.
