# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRMED_1

Run only after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1` is merged.

## Scope

Perform a guarded route readback validation for `providers.qwen25Vl.structuredVisualMetadataPlan` only if the executor provides:

`REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION=true`

The prompt must name the target and provide non-secret approved snapshot, credit reservation, queue lease, private input manifest, private artifact manifest, private artifact checksum, source sequence map, compiled intent, model routing policy, QA policy, authenticated user, workspace membership, and route idempotency references.

## Boundaries

Do not print secret payloads. Do not mutate Supabase, execute SQL, call QWEN/provider/model paths, dispatch workers, process media, create signed/public artifacts, run final render/export, or unlock external beta. If any runtime confirmation or named target is missing, fail closed.
