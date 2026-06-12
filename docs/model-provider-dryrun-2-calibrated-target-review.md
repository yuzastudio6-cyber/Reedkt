# MODEL-DRYRUN-2 Calibrated Target Review

MODEL-TIMEOUT-1 readiness: `qwen_schema_timeout_calibrated_ready_for_model_dryrun`.

Calibrated Qwen target:
- model: `qwen3.7-plus`
- mode: `non_streaming`
- timeout: `45000ms`
- max output tokens: `650`
- stream: `false`
- `qwen3.7-max` used in MODEL-DRYRUN-2: `false`

DashScope config gate:
- `DASHSCOPE_BASE_URL` must resolve from Secret Manager to `https://dashscope-us.aliyuncs.com/compatible-mode/v1`.
- `DASHSCOPE_REGION` must resolve from Secret Manager to `us`.
- Provider key payloads are never printed, committed, or stored in reports.

DeepSeek remains the existing approved synthetic control path. No DeepSeek target expansion, provider chaining, broad provider runtime, workers, tools, routes, media processing, public artifacts, signed URLs, Supabase mutation, SQL, production, external beta, or paid production is enabled.
