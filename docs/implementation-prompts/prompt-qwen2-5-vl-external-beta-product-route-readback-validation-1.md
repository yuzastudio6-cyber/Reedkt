# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1

Run only after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1` is merged.

## Scope

Validate the backend route readback plan for `providers.qwen25Vl.structuredVisualMetadataPlan` without calling QWEN, workers, providers, media tools, Cloud Run, Supabase mutation, SQL mutation, signed/public artifact creation, or final render/export unless a later prompt adds an explicit confirmation gate.

## Required Inputs

- Approved snapshot readback reference.
- Credit reservation readback reference.
- Queue lease readback reference.
- Private input manifest readback reference.
- Private artifact manifest readback reference.
- Private artifact checksum readback reference.
- Source sequence map readback reference.
- Compiled intent readback reference.
- Model routing policy readback reference.
- QA policy readback reference.
- Authenticated user and workspace membership references.
- Route idempotency key.

## Runtime Rule

If this validation performs remote readback, it must name the target, require an explicit confirmation gate, avoid secret payload printing, and record fail-closed restoration. If no confirmation is present, remain docs/source-only and fail closed.
