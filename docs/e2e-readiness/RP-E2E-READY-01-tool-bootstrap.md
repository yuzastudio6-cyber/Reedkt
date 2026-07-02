# RP-E2E-READY-01 Tool Bootstrap

Prompt 5 added the worker queue and tool readiness layer. The first local report showed the host machine did not have FFmpeg, FFprobe, Remotion, Sharp/libvips, Playwright, Signalsmith Stretch, or Python-backed optional tools available.

Prompt 5.5 creates a reproducible way to verify the required tools before Prompt 6 without pretending unavailable tools are installed.

## What This Adds

- A local/dev/test Docker worker image with Node, FFmpeg, FFprobe, Python 3, pip, and shell utilities.
- Package scripts for Docker build, Docker tool checks, tool summary, and Prompt 6 readiness smoke.
- A host bootstrap guide for macOS, Ubuntu/Debian, Windows, and Docker fallback.
- A JSON summary command that marks Prompt 6 ready only when FFmpeg and FFprobe are available.

## Required Tools For Prompt 6

Prompt 6 requires:

- `ffmpeg`
- `ffprobe`

The checks run only safe version commands. They do not process user media, render video, call providers, access Supabase, deploy Google Cloud, or require secrets.

## Optional Tools For Later

- Remotion and Sharp/libvips remain future compositor/image worker work.
- AudioFlux, OpenCV, VapourSynth, Playwright, and Signalsmith Stretch remain future optional worker milestones.

Missing optional tools should be recorded honestly as unavailable.

## Commands

Host summary:

```bash
npm run tools:summary
```

Host Prompt 6 smoke:

```bash
npm run smoke:prompt6-ready
```

Strict host Prompt 6 smoke:

```bash
STRICT_PROMPT6_TOOL_READINESS=true npm run smoke:prompt6-ready
```

Docker path:

```bash
npm run docker:worker:build
npm run docker:worker:tools
npm run docker:worker:smoke
docker run --rm --env API_ALLOW_MOCK_WITHOUT_SUPABASE=true --env E2E_RUNTIME_MODE=local --env WORKER_RUNTIME_MODE=local --env STRICT_PROMPT6_TOOL_READINESS=true reeditpro-worker-dev npm run smoke:prompt6-ready
```

## What Remains For Prompt 6

Prompt 6 can run a real media-readiness smoke only after FFmpeg and FFprobe are available on the host or in the Docker worker image. It still must keep approved snapshot, credit reservation, job claim, storage, and provider-disabled gates intact.

Production FFmpeg and codec usage still needs LGPL-safe build/configuration review and deployment review before customer media work.
