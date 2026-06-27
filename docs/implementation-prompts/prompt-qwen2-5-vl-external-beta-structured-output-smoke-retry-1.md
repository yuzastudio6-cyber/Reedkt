# QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1

Run a guarded private structured-output smoke retry only after `QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1` and `QWEN2_5_VL_EXTERNAL_BETA_PRIVATE_CALLER_IMAGE_SOURCE_IMPORT_1` are merged and validated.

Required confirmation gate: `REEDITPRO_CONFIRM_QWEN2_5_VL_STRUCTURED_OUTPUT_SMOKE_RETRY=true`.

The retry must prove `parsedJson=true`, `schemaValid=true`, non-empty object rows, non-empty text-like region rows, `rawOutputStoredInRepo=false`, sanitized metadata-only output, private-only artifact boundaries, approved snapshot references, credit reservation references, service-role/secret isolation, and fail-closed restoration.

The retry must rebuild/update the CPU private caller from repo-owned source (`docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile` plus current `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`) before execution. Do not reuse an older caller image as accepted structured-output evidence.

Do not unlock broad external beta, paid production, production, public artifacts, signed URLs, final render/export, arbitrary user media, frontend provider calls, Supabase mutation, SQL execution, or raw prompt execution.
