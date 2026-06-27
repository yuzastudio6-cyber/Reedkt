# QWEN2.5-VL Fail-Closed Restore Readback

Packet: `QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1`

Restore status: `passed`

## Guarded Runtime Scope

The confirmed retry temporarily enabled only the bounded QWEN2.5-VL approved fixture inference path for the smoke command. It did not enable broad external beta, paid production, public artifacts, signed URLs, arbitrary user media, frontend provider calls, Supabase mutation, SQL execution, or final render/export.

## Restore Evidence

After the failed retry, the restore trap completed:

- Restore marker: `RESTORE_DONE qwen25-structured-output-smoke-retry-timeoutfix-20260627T212630Z`
- Service latest ready revision after restore: `reeditpro-qwen2-5-vl-l4-worker-00017-p4b`
- CPU caller job latest generation after restore: `10`

Service fail-closed environment readback:

- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- `QWEN_INFERENCE_ENABLED=false`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `RAW_VLM_PROMPT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `MEDIA_PROCESSING_ENABLED=false`
- `REAL_MEDIA_INPUT_ENABLED=false`
- `ARBITRARY_MEDIA_INPUT_ENABLED=false`
- `PUBLIC_OUTPUT_ENABLED=false`
- `TRACK_A_EXECUTION_ENABLED=false`

CPU caller job fail-closed readback:

- `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`
- `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`
- `QWEN_CPU_CALLER_TIMEOUT_SECONDS=20`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- `QWEN_INFERENCE_ENABLED=false`
- `RAW_VLM_PROMPT_ENABLED=false`
- `PROVIDER_EXECUTION_ENABLED=false`
- `MEDIA_PROCESSING_ENABLED=false`
- `PUBLIC_OUTPUT_ENABLED=false`
- `TRACK_A_EXECUTION_ENABLED=false`
- Cloud Run Job task timeout restored to `60s`

The temporary invocation target and audience environment values were removed from the restored job template.

## Safety Result

Fail-closed restoration is accepted. Runtime readiness is not advanced because structured output was not accepted.
