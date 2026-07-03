# Validation Results

Validation status: `passed`

Required commands:

- `npm ci --no-audit --no-fund --progress=false`
- `npm run --silent tracka:three-tool-external-agent-external-beta-readiness-rollup-1:diagnostics`
- `npm run --silent tracka:three-tool-external-agent-worker-process-approved-snapshot-execution-1:diagnostics`
- `npm run --silent tracka:three-tool-external-agent-worker-dispatch-claim-lease-1:diagnostics`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
