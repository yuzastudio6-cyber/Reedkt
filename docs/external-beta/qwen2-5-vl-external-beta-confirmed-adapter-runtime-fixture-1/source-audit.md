# QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1 Source Audit

Packet: `QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1`

Decision: `completed_qwen2_5_vl_external_beta_confirmed_adapter_runtime_fixture`

Execution: `completed_confirmed_backend_adapter_runtime_fixture_with_fail_closed_restore`

Integration base: `02cfeab7d8f98c8bbe915b3da15a95c5542f224f`

## Source Chain

- #1312 proved the tuned L4/vLLM structured-output runtime path with sanitized fixture evidence.
- #1315 merged the external-beta runtime gate integration and required approved snapshot, credit reservation, queue lease, idempotency, private artifact manifest, and checksum references.
- #1321 merged the backend-only runtime adapter source contract and made `QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE_1` the next milestone.
- #577 remains open/draft/blocked/excluded and is not a QWEN source-of-truth dependency.

## Owner Decision

The repo/cloud evidence was sufficient to proceed without waiting for a separate owner-chat response. The confirmed runtime fixture stayed bounded to the already-approved QWEN backend adapter lane and did not broaden product beta or production scope.

Required confirmation was present for the single run:

- `REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_CONFIRMED_ADAPTER_RUNTIME_FIXTURE=true`;
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE=true`;
- `REEDITPRO_EXTERNAL_BETA_TARGET_REF=wmyyttnynmteqgcdishd`;
- `REEDITPRO_QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_SCOPE=approved_snapshot_structured_metadata_only`;
- approved snapshot reference;
- credit reservation reference;
- queue lease reference;
- idempotency key;
- private artifact manifest reference;
- private artifact checksum reference.

## Runtime Bounds

The fixture temporarily enabled only the QWEN approved fixture inference path on `reeditpro-qwen2-5-vl-l4-worker` and executed only `reeditpro-qwen2-5-vl-private-caller`.

The bounded tuning values were:

- `QWEN_VLLM_MAX_MODEL_LEN=2048`;
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024`;
- `QWEN_VLLM_MAX_NUM_SEQS=1`;
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`;
- `QWEN_FIXTURE_MAX_TOKENS=180`.

The run used the repo-owned generated fixture path and backend private caller. It did not use raw chat, arbitrary user media, public artifacts, signed URL source-of-truth, broad external beta, paid production, production, or final render/export.

External beta unlocked in this phase: `false`

Product-ready end-to-end local OSS tools: `0`

Package-lock: `unchanged`

Generated artifacts committed: `none`
