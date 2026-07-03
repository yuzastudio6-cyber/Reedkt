# Validation Results

Validation status: `passed`

Required validation:
- `npm ci --no-audit --no-fund --progress=false`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent tracka:gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-external-agent-generated-fixture-qa-rollup-1:diagnostics`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`
- non-executing changed-file and staged safety scans

Package-lock: `unchanged`

Generated artifacts committed: `none`
