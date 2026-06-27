# QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SMOKE_RETRY_1

Run a guarded private structured-output smoke retry only after `QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1` is merged and validated.

Required confirmation gate: `REEDITPRO_CONFIRM_QWEN2_5_VL_STRUCTURED_OUTPUT_SMOKE_RETRY=true`.

The retry must prove `parsedJson=true`, `schemaValid=true`, non-empty object rows, non-empty text-like region rows, `rawOutputStoredInRepo=false`, sanitized metadata-only output, private-only artifact boundaries, approved snapshot references, credit reservation references, service-role/secret isolation, and fail-closed restoration.

Do not unlock broad external beta, paid production, production, public artifacts, signed URLs, final render/export, arbitrary user media, frontend provider calls, Supabase mutation, SQL execution, or raw prompt execution.
