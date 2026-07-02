# Validation Results

Validation status: `passed`

Host-resource blocker: `closed`

Initial `/Volumes/backup` dependency validation failed with `ENOSPC` while creating `node_modules/.bin`. Full validation was rerun and passed in a clean larger validation clone under `/Users/macuser/codex-worktrees/`.

Commands passed:

- `npm ci --no-audit --no-fund --progress=false`
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
