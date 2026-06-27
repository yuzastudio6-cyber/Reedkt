# QWEN2_5_VL_EXTERNAL_BETA_STRUCTURED_OUTPUT_SOURCE_IMPORT_1

Create a fresh integration-based PR that imports the QWEN2.5-VL fail-closed structured-output source fix from PR #1287 without merging the no-merge-base QWEN stack directly.

Allowed import scope:

- `server/workers/qwen2_5_vl_cloud_run_gpu/service.py`
- `server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py`
- Required QWEN2.5-VL docs, mock records, smokes, and UI routing status helpers needed for the #1287 structured-output source fix to validate on integration.
- Package smoke/diagnostic scripts only.

Required decision: `completed_qwen2_5_vl_fail_closed_structured_output_source_import_ready_for_guarded_smoke_retry`.

Keep QWEN runtime blocked until a later confirmed structured-output smoke retry proves `parsedJson=true`, `schemaValid=true`, object/text-like region rows, sanitized metadata, private-only artifact boundaries, approved snapshot boundaries, and credit/secret gates.

Do not run Cloud Run deployment/invocation, identity token fetch, model import/load, vLLM initialization, provider/model calls, worker dispatch, Supabase, SQL, generated asset creation, signed/public artifacts, media processing, render/export, Docker, dependency mutation, beta unlock, or production unlock.
