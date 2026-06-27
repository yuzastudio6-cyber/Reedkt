# RP QWEN2.5-VL External Beta vLLM L4 KV-Cache Tuning Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1`

Decision: `completed_qwen2_5_vl_l4_vllm_kv_cache_tuning_structured_output_smoke_passed`

Execution: `completed_guarded_private_structured_output_smoke_with_tuned_l4_vllm_config_and_fail_closed_restore`

## Result

The guarded QWEN2.5-VL structured-output smoke passed after applying the L4 vLLM tuning env vars:

- `QWEN_VLLM_MAX_MODEL_LEN=2048`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024`
- `QWEN_VLLM_MAX_NUM_SEQS=1`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`
- `QWEN_FIXTURE_MAX_TOKENS=180`

Execution: `reeditpro-qwen2-5-vl-private-caller-pdvgn`

Run ID: `qwen25-vllm-l4-kv-cache-tuning-20260627T214934Z`

Fail-closed restore: `passed`

## Acceptance

- `parsedJson=true`
- `schemaValid=true`
- `objectCount=3`
- `textLikeRegionCount=1`
- `rawOutputStoredInRepo=false`
- `structuredMetadataOutputAccepted=true`

## Status

- QWEN structured output runtime: `ready_for_external_beta_runtime_gate_integration`
- Validation: `passed`
- Product-ready end-to-end local OSS tools: `0`
- Package-lock: `unchanged`
- Generated artifacts committed: `none`

## Next Milestone

`QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1`

## Safety

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, frontend provider call, worker dispatch, product route execution, browser capture, signed URL creation, public artifact creation, generated asset creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta unlock, paid production unlock, production unlock, raw prompt execution, final render/export, arbitrary private media processing, arbitrary user media processing, Docker push, package installation beyond dependency validation, dependency mutation, package-lock mutation, or broad service-role handler was enabled. The guarded proof temporarily performed bounded Cloud Run deployment/update, identity token fetch, private Cloud Run invocation, QWEN model load, vLLM initialization, and approved synthetic fixture inference, then restored the service and job fail-closed.
