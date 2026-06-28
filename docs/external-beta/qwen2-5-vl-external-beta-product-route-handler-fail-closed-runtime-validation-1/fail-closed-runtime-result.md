# QWEN2.5-VL Product Route Handler Fail-Closed Runtime Result

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_FAIL_CLOSED_RUNTIME_VALIDATION_1`

Decision: `completed_qwen2_5_vl_product_route_handler_fail_closed_runtime_validation`

Execution: `completed_local_in_process_route_fail_closed_runtime_validation_no_provider_or_remote_execution`

Route id: `providers.qwen25Vl.structuredVisualMetadataPlan`

Route path: `/api/providers/qwen2-5-vl/structured-visual-metadata`

Local runtime target: `local_in_process_express_app`

Validated result: `PROVIDER_ROUTE_BLOCKED`

Validated HTTP status: `424`

## Runtime Matrix

| Case | Result |
| --- | --- |
| Missing idempotency header | `IDEMPOTENCY_KEY_REQUIRED` / HTTP `400` |
| Valid required refs without readback gate | `PROVIDER_ROUTE_BLOCKED` / HTTP `424` / `blocked_pending_route_readback_validation_gate` |
| Unsafe provider/model request flag | `PROVIDER_ROUTE_BLOCKED` / HTTP `424` / `blocked_product_route_handler_unsafe_runtime_request` |
| Confirmed readback gate env present | `PROVIDER_ROUTE_BLOCKED` / HTTP `424` / `blocked_provider_runtime_not_enabled` |

## Safety Result

Route handler runtime validation: `passed`

Route handler fail-closed: `true`

Route readback execution allowed now: `false`

Provider/model call allowed now: `false`

Worker dispatch allowed now: `false`

Media processing allowed now: `false`

Signed URL creation allowed now: `false`

Public artifact allowed now: `false`

Final render/export allowed now: `false`

External beta unlock allowed now: `false`

Product-ready end-to-end local OSS tools: `0`

Next milestone: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRMED_1`
