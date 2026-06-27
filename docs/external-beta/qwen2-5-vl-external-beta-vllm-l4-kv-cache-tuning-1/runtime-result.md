# QWEN2.5-VL L4 vLLM KV-Cache Tuning Runtime Result

Packet: `QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1`

Decision: `completed_qwen2_5_vl_l4_vllm_kv_cache_tuning_structured_output_smoke_passed`

Execution: `completed_guarded_private_structured_output_smoke_with_tuned_l4_vllm_config_and_fail_closed_restore`

## Source Chain

- #1294 merged the QWEN2.5-VL structured-output service and caller source into integration.
- #1297 merged the private caller image source into integration.
- #1305 recorded the post-#1297 smoke retry blocker: `blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable_after_timeout_repair`.
- #577 remains open/draft/blocked and excluded.

## Tuned Runtime Config

The successful retry used the existing repo-owned service env surface and temporary Cloud Run configuration only:

- `QWEN_VLLM_MAX_MODEL_LEN=2048`
- `QWEN_VLLM_MAX_NUM_BATCHED_TOKENS=1024`
- `QWEN_VLLM_MAX_NUM_SEQS=1`
- `QWEN_VLLM_GPU_MEMORY_UTILIZATION=0.92`
- `QWEN_FIXTURE_MAX_TOKENS=180`
- Cloud Run Job task timeout: `900s` for the guarded run only

These values match the already-documented L4 conservative short-context profile used elsewhere in the repo while preserving the existing QWEN service image and fail-closed source behavior.

## Successful Execution

- Run ID: `qwen25-vllm-l4-kv-cache-tuning-20260627T214934Z`
- Execution: `reeditpro-qwen2-5-vl-private-caller-pdvgn`
- Completion: `succeeded`
- Duration: `7m21.49s`
- HTTP status: `200`
- Service reason: `qwen_fixture_inference_smoke_completed`
- Runtime version present: `true`
- Runtime contract executes now: `true`
- Fixture inference smoke passed: `true`
- Structured metadata output accepted: `true`

## Structured Output

- `parsedJson`: `true`
- `schemaValid`: `true`
- `objectCount`: `3`
- `textLikeRegionCount`: `1`
- `spatialRelationCount`: `2`
- `blockedActionCount`: `4`
- `rawOutputStoredInRepo`: `false`
- `outputTextLength`: `645`
- `outputTextSha256`: `f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`
- `normalizedMetadataSha256`: `f18b566fa1936ec68cf36dfd3c8fa5145ee22e0bc7a06ea9ca8930f50c2bd1d4`

## Runtime Side Effects

Expected bounded runtime effects for this guarded proof:

- Identity token fetched: `true`
- Private Cloud Run invocation attempted: `true`
- QWEN model load run: `true`
- vLLM engine initialized: `true`
- Inference run: `true`

Forbidden effects remained false:

- Generated assets created: `false`
- Public artifacts created: `false`
- Signed URLs created: `false`
- Supabase touched: `false`
- SQL executed: `false`
- Workers dispatched: `false`
- Credit mutation created: `false`

## Readiness

QWEN2.5-VL structured-output runtime is ready for `QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_INTEGRATION_1`.

This does not unlock broad external beta, paid production, public artifacts, arbitrary user media, frontend provider calls, Supabase mutation, SQL execution, workers, routes, or final render/export.
