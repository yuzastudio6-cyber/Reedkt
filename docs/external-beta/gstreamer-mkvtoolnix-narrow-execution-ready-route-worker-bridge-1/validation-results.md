# Validation Results

Validation status: `passed`

Required validation:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Observed validation:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1`: `passed`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1:diagnostics`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `git diff --cached --check`: `passed`

Safety scan mode: `non_executing_file_content_scan`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
