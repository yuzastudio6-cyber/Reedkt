# QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1

Implement a narrow source/config repair for the QWEN2.5-VL Cloud Run L4 worker after `QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1` failed with `blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable`.

## Required Evidence To Preserve

- #1294 imported the structured-output service/caller source.
- #1297 imported the private caller image source.
- The post-#1297 retry reached QWEN service runtime after a task-timeout repair.
- Final failed execution: `reeditpro-qwen2-5-vl-private-caller-wz4nx`.
- Exact service blocker: vLLM reported no available memory for cache blocks and available KV cache memory `-0.08 GiB`.
- Fail-closed restore passed.

## Repair Scope

Use only the repo-owned QWEN worker source and Cloud Run configuration surface. The repair may introduce or tighten bounded defaults for L4-safe vLLM tuning, such as `QWEN_VLLM_MAX_MODEL_LEN`, `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS`, `QWEN_VLLM_GPU_MEMORY_UTILIZATION`, or equivalent source-owned knobs, but must keep runtime fail-closed by default.

Do not broaden media, provider, worker, route, Supabase, SQL, credit, public artifact, signed URL, broad beta, production, or final render/export gates.

## Follow-Up Runtime Proof

Only after source/config validation passes, run a new guarded structured-output smoke retry with:

`REEDITPRO_CONFIRM_QWEN2_5_VL_STRUCTURED_OUTPUT_SMOKE_RETRY=true`

The follow-up must prove `parsedJson=true`, `schemaValid=true`, non-empty object rows, non-empty text-like region rows, `rawOutputStoredInRepo=false`, private-only metadata output, approved snapshot refs, credit reservation refs, service-role/secret isolation, and fail-closed restoration.
