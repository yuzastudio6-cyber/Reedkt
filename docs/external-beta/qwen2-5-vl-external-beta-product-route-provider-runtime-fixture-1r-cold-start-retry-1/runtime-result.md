# QWEN Product Route Provider Runtime Fixture 1R Cold-Start Retry Result

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1`

Decision: `completed_qwen2_5_vl_product_route_provider_runtime_fixture_after_cold_start_retry`

Execution: `completed_confirmed_product_route_provider_runtime_fixture_after_cold_start_retry`

Base: `e2b8a5d08a8f80de24477be6c811d5f072a3dcd7`

## Confirmed Runtime Result

The cold-start retry runner executed with `REEDITPRO_CONFIRM_QWEN2_5_VL_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_COLD_START_RETRY=true`.

Cold-start retry run ID: `qwen25-product-route-provider-runtime-fixture-cold-start-retry-1-2026-06-28T04-59-27-073Z-f334595a`

Product-route run ID: `qwen25-product-route-provider-runtime-fixture-1r-2026-06-28T04-59-27-133Z-37e1aba2`

Adapter runtime run ID: `qwen25-adapter-runtime-fixture-2026-06-28T04-59-27-623Z-37144e9c`

Cloud Run job execution: `reeditpro-qwen2-5-vl-private-caller-8rnk9`

HTTP status: `200`

Service reason: `qwen_fixture_inference_smoke_completed`

Structured metadata accepted: `true`

Runtime contract executes now: `true`

Model inference enabled for this bounded fixture: `true`

Inference run: `true`

Fail-closed restore: `passed`

## Attempt Matrix

| Attempt | Execution | HTTP | Service reason | Metadata accepted | Objects | Text-like regions | Retry candidate |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `reeditpro-qwen2-5-vl-private-caller-8rnk9` | `200` | `qwen_fixture_inference_smoke_completed` | `true` | `3` | `1` | `false` |

The retry policy remains bounded to at most `2` adapter attempts and a `300` second wait only after an HTTP `502` cold-start candidate. This successful run completed on the first adapter attempt after the corrected retry source.

Product-ready end-to-end local OSS tools: `0`

Next milestone: `RP-EXTERNAL-BETA-QWEN2_5_VL_PRODUCT_ROUTE_RUNTIME_READINESS_ROLLUP_1`
