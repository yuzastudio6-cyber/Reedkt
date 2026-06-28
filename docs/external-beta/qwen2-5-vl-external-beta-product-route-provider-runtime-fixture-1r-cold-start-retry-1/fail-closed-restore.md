# Fail-Closed Restore

Packet: `QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_PROVIDER_RUNTIME_FIXTURE_1R_COLD_START_RETRY_1`

Fail-closed restore: `passed`

## Service After Restore

- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- `QWEN_INFERENCE_ENABLED=false`
- latest ready revision recorded in sanitized report: `reeditpro-qwen2-5-vl-l4-worker-00031-lj4`

## Job After Restore

- `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`
- `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`
- `QWEN_CPU_CALLER_TIMEOUT_SECONDS=20`
- task timeout restored to `60`

No broad external beta, paid production, public artifact, Supabase, SQL, media, or final export unlock remained enabled after the fixture.
