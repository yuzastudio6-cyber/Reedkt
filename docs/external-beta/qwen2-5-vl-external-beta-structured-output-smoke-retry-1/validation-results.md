# Validation Results

Packet: `QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1`

Decision: `blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable_after_timeout_repair`

Execution: `completed_guarded_private_structured_output_smoke_retry_with_fail_closed_restore_blocked`

## Runtime Evidence

- Confirmation gate: `REEDITPRO_CONFIRM_QWEN2_5_VL_STRUCTURED_OUTPUT_SMOKE_RETRY=true`
- CPU private caller source from #1297 was used for the retry path.
- Attempt 1 blocker: `blocked_cloud_run_job_task_timeout_60s_before_structured_output_response`
- Attempt 2 blocker: `blocked_qwen2_5_vl_vllm_kv_cache_memory_unavailable`
- Final execution: `reeditpro-qwen2-5-vl-private-caller-wz4nx`
- Final run ID: `qwen25-structured-output-smoke-retry-timeoutfix-20260627T212630Z`
- Final service reason: `qwen_fixture_inference_smoke_failed`
- Final HTTP status: `500`
- Final metadata output accepted: `false`
- Final fail-closed restore: `passed`

## Validation

Recorded validation for this packet:

- `gcloud run jobs executions describe reeditpro-qwen2-5-vl-private-caller-wz4nx --project=reeditpro --region=us-central1 --format=json`
- Cloud Logging readback for `reeditpro-qwen2-5-vl-private-caller-wz4nx`
- Cloud Run service fail-closed readback for `reeditpro-qwen2-5-vl-l4-worker`
- Cloud Run job fail-closed readback for `reeditpro-qwen2-5-vl-private-caller`
- `npm ci --no-audit --no-fund --progress=false`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm run lint`
- `npm run typecheck:server`
- `npm run build`
- `npm run build:server`
- `npm run --silent rp-qwen2-5-vl-external-beta-stack-integration-rollup-1:diagnostics`
- `npm run --silent rp-qwen2-5-vl-external-beta-structured-output-source-import-1:diagnostics`
- `npm run --silent rp-qwen2-5-vl-external-beta-private-caller-image-source-import-1:diagnostics`
- `npm run --silent rp-qwen2-5-vl-external-beta-structured-output-smoke-retry-1:diagnostics`
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`
- non-executing changed-file and staged safety scans

Full repository validation passed for this blocked-runtime evidence packet.

## Status

- QWEN runtime: `blocked_pending_qwen2_5_vl_l4_vllm_kv_cache_tuning`
- Structured output accepted: `false`
- Product-ready end-to-end local OSS tools: `0`
- Package-lock: `unchanged`
- Generated artifacts committed: `none`

## Safety

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, frontend provider call, worker dispatch, product route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, broad external beta unlock, paid production unlock, production unlock, raw prompt execution, final render/export, arbitrary private media processing, arbitrary user media processing, Docker push, public artifact creation, package installation beyond dependency validation, dependency mutation, package-lock mutation, or broad service-role handler was enabled. The guarded retry temporarily performed bounded Cloud Run deployment/update, identity token fetch, private Cloud Run invocation, QWEN model load, vLLM initialization attempt, and fixture inference attempt, then restored the service and job fail-closed.
