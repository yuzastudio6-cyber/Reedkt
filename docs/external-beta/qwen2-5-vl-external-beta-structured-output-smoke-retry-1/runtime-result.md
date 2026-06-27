# QWEN2.5-VL Structured Output Smoke Retry Runtime Result

Packet: `QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1`

Decision: `blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable_after_timeout_repair`

Execution: `completed_guarded_private_structured_output_smoke_retry_with_fail_closed_restore_blocked`

## Source Chain

- #1294 merged the QWEN2.5-VL structured-output service and caller source into integration.
- #1297 merged the private caller image source into integration.
- The retry was run after #1294 and #1297 were merged.
- #577 remains open/draft/blocked and excluded.

## Guarded Attempts

Attempt 1:

- Run ID: `qwen25-structured-output-smoke-retry-20260627T212113Z`
- Execution: `reeditpro-qwen2-5-vl-private-caller-gx29k`
- Result: `blocked_cloud_run_job_task_timeout_60s_before_structured_output_response`
- Repair applied: Cloud Run Job task timeout was set to `900s` for the next guarded attempt only, then restored fail-closed.

Attempt 2:

- Run ID: `qwen25-structured-output-smoke-retry-timeoutfix-20260627T212630Z`
- Execution: `reeditpro-qwen2-5-vl-private-caller-wz4nx`
- Result: `blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable`
- Job completion: failed with exit code `3`
- HTTP status from service: `500`
- Service reason: `qwen_fixture_inference_smoke_failed`
- Structured metadata accepted: `false`
- Metadata output: empty sanitized object

## Exact Blocker

The timeout repair allowed the request to reach the QWEN service runtime path. The service loaded the model weights and then vLLM failed during engine initialization:

`ValueError: No available memory for the cache blocks. Try increasing gpu_memory_utilization when initializing the engine.`

The service log also reported available KV cache memory as `-0.08 GiB`.

## Acceptance

The structured-output smoke retry did not prove the required acceptance values:

- `parsedJson=true`: not proven
- `schemaValid=true`: not proven
- non-empty object rows: not proven
- non-empty text-like region rows: not proven
- `rawOutputStoredInRepo=false`: preserved by source boundary, but no accepted output was produced in this retry

## Readiness

QWEN2.5-VL runtime readiness remains blocked pending a narrow L4/vLLM KV-cache tuning repair and a new guarded structured-output retry.

Next milestone: `QWEN2_5_VL_EXTERNAL_BETA_VLLM_L4_KV_CACHE_TUNING_1`
