# Validation Results

Validation status: `passed`

Commands run:
- `npm ci --no-audit --no-fund --progress=false`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --quiet -- package-lock.json`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_GENERATED_FIXTURE_EXECUTION=true npm run tracka:gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1`

Post-update validation to rerun:
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run --silent tracka:three-tool-external-agent-worker-process-noop-invoke-1:diagnostics`
- `npm run --silent tracka:gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1:diagnostics`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`
- non-executing changed-file and staged safety scans

Package-lock: `unchanged`

Generated artifacts committed: `none`
