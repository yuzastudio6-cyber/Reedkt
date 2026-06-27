# QWEN2.5-VL External Beta Runtime Gate Contract

Packet: `QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1`

Decision: `completed_qwen2_5_vl_external_beta_runtime_gate_integration_source_contract`

Execution: `completed_source_contract_no_qwen_runtime_execution`

## Required Gate Inputs

The future backend-only QWEN adapter must require all of these inputs before it can attempt structured metadata runtime invocation:

| Gate | Required value |
| --- | --- |
| Source decision | `completed_qwen2_5_vl_l4_vllm_kv_cache_tuning_structured_output_smoke_passed` |
| Runtime gate env | `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true` |
| Target ref | `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd` |
| Runtime scope | `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only` |
| Approved snapshot reference | required |
| Credit reservation reference | required |
| Queue lease reference | required |
| Idempotency key | required |
| Private artifact manifest reference | required |
| Private artifact checksum reference | required |

## Required L4 vLLM Config

The proved QWEN L4 runtime configuration is:

- `QWEN_VLLM_MAX_MODEL_LEN=2048`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024`
- `QWEN_VLLM_MAX_NUM_SEQS=1`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`

Future adapter work must keep bounded task-specific token limits and must not infer production readiness from the tuning proof alone.

## Blocked Inputs

The gate contract blocks:

- frontend provider calls;
- frontend model calls;
- raw prompt execution;
- arbitrary user media input;
- public artifact requests;
- signed URL requests;
- broad external beta;
- paid production;
- production;
- final render/export.

## Source Interface

New source interface:

- `evaluateQwen25VlExternalBetaRuntimeGate`
- `assertQwen25VlExternalBetaRuntimeGateResult`
- package smoke `smoke:qwen2-5-vl-external-beta-runtime-gate-integration-1`

This interface is a local source contract only. It performs no Cloud Run call, no provider/model call, no worker dispatch, no route execution, no Supabase mutation, no SQL execution, no media processing, and no artifact creation.
