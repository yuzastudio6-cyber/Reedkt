# QWEN2.5-VL L4 Tuning Fail-Closed Restore

Packet: `QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1`

Restore status: `passed`

## Temporary Runtime Scope

The proof temporarily updated the existing QWEN2.5-VL Cloud Run service with the L4 vLLM tuning env vars and fixture inference gates, then ran the private CPU caller job once under the confirmation gate.

The proof did not create public artifacts, signed URLs, generated assets, Supabase writes, SQL writes, credit mutations, worker dispatches, product route calls, broad beta access, production access, or final render/export.

## Restore Readback

After the successful proof, the restore trap completed:

- Restore marker: `RESTORE_DONE qwen25-vllm-l4-kv-cache-tuning-20260627T214934Z`
- Service latest ready revision after restore: `reeditpro-qwen2-5-vl-l4-worker-00019-qgn`
- Job generation after restore: `12`

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

The temporary tuning env vars were removed from the restored service template:

- `QWEN_VLLM_MAX_MODEL_LEN`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION`
- `QWEN_VLLM_MAX_NUM_SEQS`
- `QWEN_FIXTURE_MAX_TOKENS`

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

The temporary target URL, audience, and request ID were removed from the restored job template.
