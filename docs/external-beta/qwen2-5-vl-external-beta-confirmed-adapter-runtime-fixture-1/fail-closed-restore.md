# Fail-Closed Restore

Packet: `QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1`

Decision: `completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture`

Execution: `completed_confirmed_backend_adapter_runtime_fixture_with_fail_closed_restore`

Fail-closed restore: `passed`

## Before

Service `reeditpro-qwen2-5-vl-l4-worker` started fail-closed:

- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- `QWEN_INFERENCE_ENABLED=false`
- latest ready revision: `reeditpro-qwen2-5-vl-l4-worker-00019-qgn`

Caller job `reeditpro-qwen2-5-vl-private-caller` started fail-closed:

- `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`
- `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`
- `QWEN_CPU_CALLER_TIMEOUT_SECONDS=20`
- task timeout: `60`

## After

The runner restored both resources after the confirmed fixture:

- service restore: `passed`
- job restore: `passed`
- `QWEN_MODEL_IMPORT_ON_STARTUP=false`
- `QWEN_APPROVED_FIXTURE_INFERENCE_ENABLED=false`
- `QWEN_INFERENCE_ENABLED=false`
- `QWEN_CPU_CALLER_EXECUTION_ENABLED=false`
- `QWEN_CPU_CALLER_EXPECT_FIXTURE_INFERENCE=false`
- `QWEN_CPU_CALLER_TIMEOUT_SECONDS=20`
- job task timeout: `60`
- latest ready revision after restore: `reeditpro-qwen2-5-vl-l4-worker-00022-5h9`
- job generation after restore: `15`

External beta unlocked in this phase: `false`

Product-ready end-to-end local OSS tools: `0`
