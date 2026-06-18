# OPEN_SOURCE_TOOL_STACK_TRACKA_BUILD_CONTEXT_GENERATION_EXECUTION

Execute only the approved build-context generation lane.

Approved commands:
- `npm run build:server` -> `dist-server`
- `npm run build:remotion-worker:mock` -> `dist-remotion-worker`
- `npm run build:staging-fixture-worker` -> `dist-staging-fixture-worker`
- `npm run build:staging-real-video-export-worker` -> `dist-staging-real-video-export-worker`

Required safety boundaries:
- Do not run Docker build/run or FFmpeg/FFprobe probes in the generation execution packet.
- Do not process media, caption burn-in, render/export, mutate Supabase/GCS, create public artifacts/signed URLs, run raw prompts, or unlock beta/production.
- Generated `dist-*` outputs must be scanned, kept local-only, removed with `rm -rf dist-server dist-remotion-worker dist-staging-fixture-worker dist-staging-real-video-export-worker`, and never committed.
