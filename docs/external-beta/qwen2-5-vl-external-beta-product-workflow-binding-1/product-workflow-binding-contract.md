# Product Workflow Binding Contract

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1`

Decision: `completed_qwen2_5_vl_external_beta_product_workflow_binding_source_contract`

Execution: `completed_product_workflow_binding_source_no_runtime_execution`

## Source Interface

This packet adds `server/services/qwen2-5-vl-external-beta-product-workflow-binding.ts`.

The contract composes the existing backend adapter and adds product workflow references. The ready status is:

`ready_for_guarded_qwen2_5_vl_external_beta_product_workflow_route_integration`

Ready product workflow inputs include:

- workflow binding id;
- workspace id;
- project id;
- edit session id;
- source sequence map reference;
- compiled intent snapshot reference;
- edit plan version reference;
- approved snapshot reference;
- credit reservation reference;
- queue lease reference;
- idempotency key;
- private input manifest reference;
- private artifact manifest reference;
- private artifact checksum reference;
- model routing policy reference;
- QA policy reference.

## Allowed Product Use

Allowed product use is limited to:

- structured visual metadata planning;
- source sequence map support;
- approved-snapshot-only binding;
- private artifact references only.

Product route execution allowed now: `false`

Worker dispatch allowed now: `false`

Provider/model call allowed now: `false`

Final render/export allowed now: `false`

Broad external beta unlock allowed now: `false`

## Blocked Inputs

The binding fails closed on:

- missing backend adapter readiness;
- missing product workflow references;
- product route execution request;
- worker dispatch request;
- provider/model call request;
- broad external beta unlock request;
- raw prompt request inherited from the backend adapter gate;
- arbitrary user media request inherited from the backend adapter gate;
- public artifact or signed URL request inherited from the backend adapter gate;
- final render/export request inherited from the backend adapter gate.
