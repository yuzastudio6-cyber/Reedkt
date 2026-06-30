# QWEN Staging API Route Deployment Alignment Validation Results

Packet: `RP-EXTERNAL-BETA-QWEN-STAGING-API-ROUTE-DEPLOYMENT-ALIGNMENT-1`

Decision: `completed_qwen_staging_api_route_deployment_alignment_current_source_bridge`

Execution: `completed_confirmed_staging_api_image_alignment_and_route_preflight_no_provider_execution`

## Runtime Validation

- `npm run typecheck:server`: `passed` before second image build.
- `npm run build:server`: `passed` before second image build.
- Cloud Build `abd118e3-6593-41e7-8809-1bf6337aadc5`: `passed`.
- Cloud Run update to `reeditpro-staging-api-00007-xbc`: `passed`.
- Bounded preflight run `2026-06-30T03-42-37-137Z-bd4b3772`: `blocked_route_response_classification_failed` with HTTP `404`.
- Cloud Build `ef61e232-f563-4e16-bf3e-50b5878d1658`: `passed`.
- Cloud Run update to `reeditpro-staging-api-00008-4ct`: `passed`.
- Bounded preflight run `2026-06-30T03-49-20-516Z-10d064e3`: `passed_route_reached_fail_closed_no_provider_execution`.

## Final Validation

- `npm ci --no-audit --no-fund --progress=false`: `passed`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`: `passed`
- `npm run --silent rp-external-beta-qwen-transport-readiness-plan-current-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-qwen-confirmed-transport-runtime-preflight-current-1:diagnostics`: `passed`
- `npm run --silent rp-external-beta-qwen-staging-api-route-deployment-alignment-1:diagnostics`: `passed`
- `npm run lint`: `passed`
- `npm run typecheck:server`: `passed`
- `npm run build`: `passed`
- `npm run build:server`: `passed`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`: `passed`
- non-executing changed/staged safety scan: `passed`

Product-ready end-to-end local OSS tools: `0`.

Package-lock: `unchanged`.

Generated artifacts committed: `none`.
