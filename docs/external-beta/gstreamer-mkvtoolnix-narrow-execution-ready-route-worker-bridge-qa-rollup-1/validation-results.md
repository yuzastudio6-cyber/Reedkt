# Validation Results

Validation status: `passed`

Observed source validation from #2113:

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `git diff --check`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1`: `passed`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1:diagnostics`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `git diff --cached --check`: `passed`

Confirmed route invocation:

- `REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true` route invocation: `passed`
- HTTP status: `201`
- Result status: `completed_narrow_execution_ready_route_worker_bridge_controlled_generated_fixture_runtime_delegate`

QA rollup validation:

- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-qa-rollup-1:diagnostics`: `passed`
- `git diff --check`: `passed`
- `git diff --cached --check`: `passed`
