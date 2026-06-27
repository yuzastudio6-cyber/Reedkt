# QWEN2.5-VL Product Workflow Route Integration Contract

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1`

Decision: `completed_qwen2_5_vl_external_beta_product_workflow_route_integration_source_contract`

Execution: `completed_backend_route_integration_source_no_runtime_execution`

## Route Contract

- Route id: `providers.qwen25Vl.structuredVisualMetadataPlan`
- Method: `POST`
- Path: `/api/providers/qwen2-5-vl/structured-visual-metadata`
- Security level: `workspace_editor`
- Runtime mode: `backend_required`
- Status: `backend_required`
- Requires Supabase: `true`
- Requires service role: `true`
- Requires provider secret boundary: `true`
- Route contract registered: `true`
- Route handler registered now: `false`
- Mock handler registered now: `false`
- Authenticated backend-only route: `true`
- Service-role-safe readback required: `true`

## Required References

The future guarded route may only proceed after service-role-safe readback references exist for:

- approved snapshot readback reference
- credit reservation readback reference
- queue lease readback reference
- private input manifest readback reference
- private artifact manifest readback reference
- private artifact checksum readback reference
- source sequence map readback reference
- compiled intent readback reference
- model routing policy readback reference
- QA policy readback reference

The route integration also requires authenticated user, workspace membership, request id, and route idempotency key references. It inherits all approved snapshot, private manifest, idempotency, source sequence map, compiled intent, model routing, and QA policy requirements from `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1`.

## Allowed Use

Structured visual metadata planning route contract: `true`

Source sequence map support route contract: `true`

Approved snapshot readback only: `true`

Private artifact reference readback only: `true`

Route execution allowed now: `false`

Remote runtime allowed now: `false`

Worker dispatch allowed now: `false`

Provider/model call allowed now: `false`

Raw prompt execution allowed now: `false`

Arbitrary user media allowed now: `false`

Signed URL creation allowed now: `false`

Public artifact allowed now: `false`

Final render/export allowed now: `false`

External beta unlock allowed now: `false`

Paid production unlock allowed now: `false`

Production unlock allowed now: `false`
