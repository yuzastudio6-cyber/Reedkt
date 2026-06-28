# Validation Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED`

Decision: `blocked_qwen_adapter_runtime_fixture_http_502_during_model_cold_start`

Execution: `confirmed_product_route_provider_runtime_fixture_attempted_fail_closed_restore_passed`

## Runtime Validation

- `npm ci --no-audit --no-fund --progress=false`: passed
- confirmed product-route provider runtime fixture runner: attempted
- product-route backend handoff validation: passed
- delegated adapter fixture: failed with `blocked_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture_failed`
- latest Cloud Run execution readback: `reeditpro-qwen2-5-vl-private-caller-h2hdk`
- job result: exit code `3`, HTTP `502`
- service log readback: service was still loading checkpoint shard `0/5`
- fail-closed restore: passed

## Source Validation

- `npm ci --no-audit --no-fund --progress=false`: passed
- `git diff --check`: passed
- `npm run smoke:qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r:diagnostics`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r-confirmed:diagnostics`: passed
- `npm run lint`: passed
- `npm run typecheck:server`: passed
- `npm run build`: passed
- `npm run build:server`: passed
- `git diff --cached --check`: passed
- non-executing changed-file and staged safety scan: passed

Validation note: an initial lint attempt overlapped with `npm ci` and failed against an incomplete local `node_modules`; after `npm ci` completed, `npm run lint` was rerun and passed.

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
