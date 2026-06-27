# RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1 Next Prompt

Use this after `RP-EXTERNAL-BETA-APPROVED-SNAPSHOT-ROUTE-WRITE-RUNTIME-VALIDATION-1` records `completed_approved_snapshot_route_write_runtime_validation`.

## Recommended Next Gate

`RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1`

## Scope

Validate one Remotion/private preview-export runtime path only if the future packet includes an explicit confirmation gate and names the single active target:

- `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

The future preview/export runtime proof must:

- use approved snapshot route-write evidence as source-of-truth;
- create only generated validation fixture rows and generated local/private preview evidence;
- clean up generated rows and local/private artifacts unless intentionally recorded as `/tmp` evidence;
- verify residue count `0`;
- avoid signed URL creation;
- avoid public artifact creation;
- avoid worker dispatch/execution;
- avoid provider/model calls;
- avoid broad media processing and user/private media;
- keep internal beta, external beta, and production locked.

## Still Blocked

External product beta remains `blocked_external_product_beta_pending_remaining_runtime_gates_after_approved_snapshot_route_write_validation` until Remotion/private preview-export runtime validation, provider/model-call policy closure, QA/cleanup/observability/rollback validation, and security/privacy/support/cost/deployment review pass.
