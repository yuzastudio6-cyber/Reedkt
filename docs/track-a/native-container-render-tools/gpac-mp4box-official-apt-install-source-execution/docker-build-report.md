# Docker Build Report

Local image tag: `reeditpro-tracka-gpac-mp4box-official-apt-install-source-execution-1:20260624T234132Z-834b63e`.

Docker build result: `passed`.

Build context was generated only because the current render-worker Dockerfile copies `dist-server`, `dist-remotion-worker`, `dist-staging-fixture-worker`, and `dist-staging-real-video-export-worker`. `npm ci --no-audit --no-fund --progress=false` ran only for that build context and did not mutate `package-lock.json`.

Build context commands run:

- `COPYFILE_DISABLE=1 npm run build:server`
- `COPYFILE_DISABLE=1 npm run build:remotion-worker:mock`
- `COPYFILE_DISABLE=1 npm run build:staging-fixture-worker`
- `COPYFILE_DISABLE=1 npm run build:staging-real-video-export-worker`

These commands were not accepted as Remotion execution, render/export, product runtime proof, or media processing. The local image was not pushed or deployed.
