# RP-EXTERNAL-PRODUCT-BETA-CURRENT-READINESS-ROLLUP-1 Next Prompt

Use this after `RP-EXTERNAL-BETA-REMOTION-PRIVATE-PREVIEW-EXPORT-RUNTIME-VALIDATION-1` records `completed_external_beta_generated_local_remotion_private_preview_export_runtime_validation`.

## Recommended Next Gate

`RP-EXTERNAL-BETA-PROVIDER-MODEL-CALL-POLICY-CLOSURE-1`

## Scope

Close provider/model-call policy for the external beta lane without enabling real provider calls unless a later packet explicitly confirms them. The policy packet must name the single active target:

- `Reeditpro` / `wmyyttnynmteqgcdishd` / `staging`

The future provider/model policy closure must:

- use approved snapshot route-write and generated-local Remotion evidence as source-of-truth;
- keep provider/model calls disabled by default;
- require backend-only provider adapters and server-side secret isolation;
- require approved snapshot, credit reservation, idempotency, cost-control, and QA fallback boundaries before any real call;
- avoid signed URL creation;
- avoid public artifact creation;
- avoid worker dispatch/execution;
- avoid real provider/model calls unless an explicit future runtime confirmation gate authorizes one bounded call;
- avoid broad media processing and user/private media;
- keep internal beta, external beta, and production locked.

## Still Blocked

External product beta remains `blocked_external_product_beta_pending_provider_policy_security_privacy_support_cost_deployment_after_remotion_runtime_validation` until provider/model-call policy closure, QA/cleanup/observability/rollback validation, and security/privacy/support/cost/deployment review pass.
