# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1

Implement the next guarded product workflow route integration only after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1` is merged.

## Required Source Evidence

Use:

- #1321 backend-only adapter source contract;
- #1328 confirmed adapter runtime fixture;
- `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1`;
- run ID `qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d`;
- service reason `qwen_fixture_inference_smoke_completed`;
- `parsedJson=true`;
- `schemaValid=true`;
- `structuredMetadataOutputAccepted=true`;
- fail-closed restore `passed`.

## Required Gate

Any route integration must remain blocked unless it proves:

- authenticated backend-only route;
- service-role-safe readback of approved snapshot, credit reservation, queue lease, private input manifest, private artifact manifest, private artifact checksum, source sequence map, compiled intent, model routing policy, and QA policy references;
- idempotency key enforcement;
- no frontend provider/model call;
- no raw prompt execution;
- no arbitrary user media;
- no public artifact;
- no signed URL source-of-truth;
- no final render/export;
- no broad external beta, paid production, or production unlock.

## Runtime Rule

If the route integration includes remote runtime, it must require a new explicit confirmation gate and prove fail-closed restore. Otherwise it must remain source-only.
