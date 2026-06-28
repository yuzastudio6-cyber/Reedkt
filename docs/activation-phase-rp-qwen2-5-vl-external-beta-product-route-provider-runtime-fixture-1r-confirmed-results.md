# RP QWEN2.5-VL Product Route Provider Runtime Fixture 1R Confirmed Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_CONFIRMED`

Decision: `blocked_qwen_adapter_runtime_fixture_http_502_during_model_cold_start`

Execution: `confirmed_product_route_provider_runtime_fixture_attempted_fail_closed_restore_passed`

The confirmed product-route provider runtime fixture was attempted through the backend handoff runner. Product-route backend handoff validation passed. The delegated adapter runtime fixture failed because the private caller observed HTTP `502` while the QWEN service was still loading checkpoint shard `0/5`.

Cloud Run execution: `reeditpro-qwen2-5-vl-private-caller-h2hdk`

Product-route run ID: `qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T04-04-09-287Z-6e6e6f3d`

Delegated adapter run ID: `qwen25-adapter-runtime-fixture-2026-06-28T04-04-09-756Z-ddcd534d`

Fail-closed restore: `passed`

Package-lock: `unchanged`

Generated artifacts committed: `none`

Product-ready end-to-end local OSS tools: `0`

Next milestone: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1`
