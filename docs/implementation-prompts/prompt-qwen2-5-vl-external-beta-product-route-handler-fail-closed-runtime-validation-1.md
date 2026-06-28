# QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_FAIL_CLOSED_RUNTIME_VALIDATION_1

Run only after `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_1` is merged.

## Scope

Execute only the fail-closed backend route path for `POST /api/providers/qwen2-5-vl/structured-visual-metadata` and prove it returns `PROVIDER_ROUTE_BLOCKED` / HTTP `424` before provider/model execution.

## Required Gate

The validation must name the target and may use local/in-process route execution only. It must not run QWEN, mutate Supabase, execute SQL, dispatch workers, process media, create signed/public artifacts, or unlock external beta.

## Next After Pass

After fail-closed route runtime validation passes, plan the guarded remote readback/runtime packet that provides named approved snapshot, credit reservation, queue lease, private manifest, checksum, source sequence map, compiled intent, model routing policy, QA policy, authenticated user, workspace membership, and route idempotency references.
