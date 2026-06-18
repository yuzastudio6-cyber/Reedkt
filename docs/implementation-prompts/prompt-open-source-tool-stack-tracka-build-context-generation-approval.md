# OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL

Use this prompt after the Docker build-context blocker-resolution PR lands.

Approve a future execution packet for these build-context generation commands only:

- `npm run build:server`
- `npm run build:remotion-worker:mock`
- `npm run build:staging-fixture-worker`
- `npm run build:staging-real-video-export-worker`

Do not approve Docker build, Docker run, FFmpeg/FFprobe probes, local host probing, media processing, caption burn-in, render/export, package-lock mutation, Dockerfile mutation, public artifacts, signed URLs, Supabase/GCS mutation, beta, or production in this approval packet.

Generated `dist-*` outputs must remain uncommitted and must be cleaned before commit.
