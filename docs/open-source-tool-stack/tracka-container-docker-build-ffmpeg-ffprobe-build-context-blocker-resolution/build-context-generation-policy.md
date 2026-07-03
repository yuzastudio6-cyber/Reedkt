# Build Context Generation Policy

- Future generation approved now: `false`
- Ready for future approval: `true`
- Future commands: `npm run build:server`, `npm run build:remotion-worker:mock`, `npm run build:staging-fixture-worker`, `npm run build:staging-real-video-export-worker`
- Generated outputs may be committed: `false`
- Cleanup policy: Future execution must remove dist-server, dist-remotion-worker, dist-staging-fixture-worker, and dist-staging-real-video-export-worker before commit; git status must be clean for those paths.
- Gitignore policy: Do not change .gitignore in this phase. dist-staging-real-video-export-worker is not currently ignored, so future execution must explicitly remove or guard it.
- Docker build still separate: `true`
- FFmpeg/FFprobe probes still separate: `true`
