# Validation Results

Validation status: `full_validation_passed`

Required validation:

- `npm ci --no-audit --no-fund --progress=false`
- `git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run smoke:rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1`
- `npm run --silent rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-fail-closed-handler-contract-1:diagnostics`
- `npm run build`
- `npm run build:server`
- `git diff --cached --check`
- non-executing changed-file and staged safety scans

Expected package-lock status: `unchanged`

Expected generated artifacts committed: `none`

Expected decision: `completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_contract`

Expected execution: `completed_source_handler_contract_no_route_worker_tool_or_media_execution`
