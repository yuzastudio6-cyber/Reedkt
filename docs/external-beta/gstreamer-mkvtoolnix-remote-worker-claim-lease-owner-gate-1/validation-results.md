# Validation Results

Validation status: `passed`

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-qa-rollup-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-remote-worker-claim-lease-owner-gate-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
