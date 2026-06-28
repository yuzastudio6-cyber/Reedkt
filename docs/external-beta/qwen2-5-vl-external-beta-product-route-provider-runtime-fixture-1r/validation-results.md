# QWEN Product Route Provider Runtime Fixture 1R Validation Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R`

Decision: `blocked_pending_product_route_provider_runtime_fixture_confirmation`

Execution: `completed_guarded_runner_source_no_provider_or_model_execution`

## Required Validation

- `npm ci --no-audit --no-fund --progress=false`: passed
- `npm run smoke:qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r:diagnostics`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-backend-job-handoff-1:diagnostics`: passed
- `npm run --silent rp-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1:diagnostics`: passed
- `npm run lint`: passed
- `npm run typecheck:server`: passed
- `npm run build`: passed
- `npm run build:server`: passed
- `git diff --check`: passed
- `git diff --cached --check`: passed
- non-executing changed-file safety scan: passed

## Runtime Runner Check

The implementation environment did not provide `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE=true`, so the product-route provider runtime fixture was not executed in this phase.

Expected fail-closed runner blocker: `blocked_pending_product_route_provider_runtime_fixture_confirmation`

Product route provider runtime fixture: `not_run_confirmation_absent`

Fail-closed run ID: `qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T03-50-52-784Z-05a14ce1`

Fail-closed output directory: `/var/folders/y2/tffpcrt16qz6ndjsjrpqxrz40000gn/T/reeditpro-qwen2-5-vl-external-beta-product-route-provider-runtime-fixture-1r/qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T03-50-52-784Z-05a14ce1`

Fail-closed artifacts:

- `qwen2-5-vl-product-route-provider-runtime-fixture-1r-report.json`: 3060 bytes, SHA-256 `ac7d2107c7ebfb7aa017c71f43e79b7345e0df131f72bf5397370614a0cab129`
- `qwen2-5-vl-product-route-provider-runtime-fixture-1r-manifest.json`: 633 bytes, SHA-256 `be96249faf3c53da7a6f7f1846f7d0b6a795d01ebde096c138ee824ba11242f4`
- `qwen2-5-vl-product-route-provider-runtime-fixture-1r-checksums.json`: 837 bytes, SHA-256 `e5bddb90d8630276d05f7ac5f2efd890191232ec1da3bf10d8beedecdb0e54d2`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`
