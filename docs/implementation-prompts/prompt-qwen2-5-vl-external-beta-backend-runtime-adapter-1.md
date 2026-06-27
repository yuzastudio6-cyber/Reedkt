# QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1

Implement the backend-only QWEN2.5-VL runtime adapter after `QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1`.

## Required Source Inputs

- #1312 proved the tuned L4/vLLM structured-output runtime.
- `QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1` added the source contract:
  - `evaluateQwen25VlExternalBetaRuntimeGate`;
  - `assertQwen25VlExternalBetaRuntimeGateResult`;
  - `smoke:qwen2-5-vl-external-beta-runtime-gate-integration-1`.

## Required Adapter Gates

The adapter must fail closed unless all are present:

- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`;
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`;
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`;
- approved plan snapshot reference;
- credit reservation reference;
- queue lease reference;
- idempotency key;
- private artifact manifest reference;
- private artifact checksum reference.

## Required Runtime Config

- `QWEN_VLLM_MAX_MODEL_LEN=2048`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024`
- `QWEN_VLLM_MAX_NUM_SEQS=1`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`

## Boundaries

Do not implement frontend provider/model calls. Do not accept raw chat as the prompt. Do not allow arbitrary user media, public artifacts, signed URL source-of-truth, broad beta, paid production, production, or final render/export.

Any future runtime execution must be a separate confirmation-gated packet with a bounded approved snapshot fixture, private artifacts/checksums, cleanup/QA evidence, and fail-closed restoration.
