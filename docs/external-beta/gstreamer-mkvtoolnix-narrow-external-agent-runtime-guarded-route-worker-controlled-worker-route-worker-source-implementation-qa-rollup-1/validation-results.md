# Validation Results

Validation status: `blocked_host_resource_limit_no_space_left_on_device_during_npm_ci`

Attempted commands:

- `npm ci --no-audit --no-fund --progress=false`

Result:

- `npm ci --no-audit --no-fund --progress=false` failed with `ENOSPC` while creating `node_modules/.bin`.
- Validation volume: `/Volumes/backup` had about `12GiB` free and could not complete dependency hydration.
- Local partial `node_modules` from the failed attempt was removed and was not committed.

Skipped pending larger validation environment:

- `git diff --check`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-implementation-qa-rollup-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Package-lock: `unchanged`

Generated artifacts committed: `none`
