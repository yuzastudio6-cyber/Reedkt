# Validation Results

Validation status: `passed`

Dry-run command passed:
- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_DRY_RUN=true npm run --silent rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1`

Commands to run:
- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-readiness-1:diagnostics`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Package-lock: `unchanged`

Generated artifacts committed: `none`
