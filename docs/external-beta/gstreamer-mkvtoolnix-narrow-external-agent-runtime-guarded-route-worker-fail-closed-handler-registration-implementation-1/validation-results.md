# Validation Results

Validation status: `passed`

Required validation:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-plan-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-registration-implementation-1:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Package-lock: `unchanged`

Generated artifacts committed: `none`
