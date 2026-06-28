# Validation Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1`

Decision: `completed_qwen2_5_vl_product_route_provider_runtime_fixture_after_cold_start_retry`

Execution: `completed_confirmed_product_route_provider_runtime_fixture_after_cold_start_retry`

## Runtime Validation

- `npm ci --no-audit --no-fund --progress=false`: passed
- `npm run smoke:qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r`: passed after dependency installation completed
- `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_COLD_START_RETRY=true npm run rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1`: passed
- Product-route backend handoff validation: passed
- Adapter runtime fixture: passed
- Cloud Run job execution: `reeditpro-qwen2-5-vl-private-caller-8rnk9`
- Fail-closed restore: passed

## Source Validation

- `git diff --check`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r:diagnostics`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed:diagnostics`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-cold-start-retry-1:diagnostics`: passed
- `npm run lint`: passed
- `npm run typecheck:server`: passed
- `npm run build`: passed
- `npm run build:server`: passed
- `git diff --cached --check`: passed
- non-executing changed-file and staged safety scan: passed

Validation note: one smoke invocation was started before `npm ci` completed and failed because `tsx` was not available yet. After dependency installation completed, `npm run smoke:qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r` was rerun and passed.

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
