# QWEN2.5-VL Product Route Handler Contract

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_1`

Decision: `completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract`

Execution: `completed_backend_route_handler_source_no_provider_or_remote_execution`

## Route

- Route id: `providers.qwen25Vl.structuredVisualMetadataPlan`
- Method: `POST`
- Path: `/api/providers/qwen2-5-vl/structured-visual-metadata`
- Route handler registered now: `true`
- Route handler fail-closed: `true`
- Authentication required: `true`
- Idempotency key header required: `true`
- Idempotency database mutation in this source phase: `false`

## Required Request References

- workspace id
- project id
- edit session id
- request id
- route idempotency key
- workspace membership reference
- approved snapshot readback reference
- credit reservation readback reference
- queue lease readback reference
- private input manifest readback reference
- private artifact manifest readback reference
- private artifact checksum readback reference
- source sequence map readback reference
- compiled intent readback reference
- edit plan version readback reference
- model routing policy readback reference
- QA policy readback reference

## Runtime Gates

- QWEN runtime gate: `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE`
- QWEN target gate: `REEDITPRO_EXTERNAL_BETA_TARGET_REF`
- QWEN scope gate: `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE`
- Route readback confirmation: `REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true`

## Current Source Behavior

The handler validates the request envelope and builds the product route readback validation result. It always fails closed with `PROVIDER_ROUTE_BLOCKED` / HTTP `424` before provider runtime execution.

Ready status: `ready_for_guarded_qwen2_5_vl_product_route_handler_fail_closed_runtime_validation`

Next milestone: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_FAIL_CLOSED_RUNTIME_VALIDATION_1`
