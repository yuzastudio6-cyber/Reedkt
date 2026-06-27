# Backend Runtime Adapter Contract

Packet: `QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_1`

Decision: `completed_qwen2_5_vl_external_beta_backend_runtime_adapter_source_contract`

Execution: `completed_backend_only_adapter_source_no_qwen_runtime_execution`

## Source Interfaces

- `buildQwen25VlExternalBetaBackendRuntimeAdapterContract`
- `assertQwen25VlExternalBetaBackendRuntimeAdapterResult`
- package smoke `smoke:qwen2-5-vl-external-beta-backend-runtime-adapter-1`

## Runtime Gate Composition

The adapter wraps:

- `evaluateQwen25VlExternalBetaRuntimeGate`
- `assertQwen25VlExternalBetaRuntimeGateResult`

The runtime gate still owns the target, scope, approved snapshot, credit reservation, queue lease, idempotency, private artifact manifest, and private artifact checksum requirements.

## Invocation Envelope

The adapter emits only a source-level invocation envelope:

- adapter request id;
- approved snapshot reference;
- credit reservation reference;
- queue lease reference;
- idempotency key;
- private artifact manifest reference;
- private artifact checksum reference;
- optional private input manifest reference;
- task class `structured_metadata_only`.

The envelope is not executed in this phase.

## Cloud Run Plan

The adapter records the existing target names for future confirmed execution planning:

- project `reeditpro`;
- region `us-central1`;
- GPU service `reeditpro-qwen2-5-vl-l4-worker`;
- CPU caller job `reeditpro-qwen2-5-vl-private-caller`.

Cloud Run service update in this phase: `false`

Cloud Run job execution in this phase: `false`

Identity token fetch in this phase: `false`

Secret payload access in this phase: `false`

## Required L4 vLLM Config

- `QWEN_VLLM_MAX_MODEL_LEN=2048`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024`
- `QWEN_VLLM_MAX_NUM_SEQS=1`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`

## Artifact Policy

- private artifacts only;
- public artifacts blocked;
- signed URL source-of-truth blocked;
- manifest required;
- checksum required;
- raw output stored in repo `false`.
