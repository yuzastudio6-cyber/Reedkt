# Validation Results

Validation status: `passed`

Commands to run before merge:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-qa-rollup-1:diagnostics`
- `git diff --cached --check`

Safety scans: non-executing file-content scans only.

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
