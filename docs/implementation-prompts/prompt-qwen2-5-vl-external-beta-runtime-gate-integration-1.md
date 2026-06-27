# QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1

Integrate the now-proven QWEN2.5-VL structured-output runtime into the external-beta runtime gate planning path after `QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1`.

## Source Evidence

- #1294 imported the fail-closed structured-output service/caller source.
- #1297 imported the private caller image source.
- #1305 recorded the post-#1297 KV-cache blocker.
- `QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1` proved the tuned L4 config with `parsedJson=true`, `schemaValid=true`, object/text-like rows, private metadata only, and fail-closed restoration.

## Required Runtime Gate

Future runtime integration must preserve:

- approved plan snapshot reference required;
- credit reservation reference required;
- queue lease and idempotency key required;
- private artifact/checksum references required;
- frontend provider/model calls forbidden;
- public artifacts and signed URLs blocked unless a separate artifact policy explicitly approves them;
- broad external beta, paid production, production, and final render/export blocked.

## Required QWEN L4 Config

- `QWEN_VLLM_MAX_MODEL_LEN=2048`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024`
- `QWEN_VLLM_MAX_NUM_SEQS=1`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`
- bounded fixture/output token limits appropriate to the approved task

Do not enable arbitrary user media, raw prompt execution, workers/routes/providers, Supabase mutation, SQL execution, credit mutation, public artifacts, broad beta, production, or final delivery/export from this integration alone.
