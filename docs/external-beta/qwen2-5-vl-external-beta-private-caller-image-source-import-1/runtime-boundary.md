# Runtime Boundary

Decision: `completed_qwen2_5_vl_private_caller_image_source_import_ready_for_guarded_structured_output_smoke_retry`

This packet is source-only. It did not build Docker, push images, update Cloud Run services or jobs, execute the private caller, fetch identity tokens, invoke Cloud Run, load QWEN, initialize vLLM, run inference, call providers, dispatch workers, call routes, mutate Supabase, execute SQL, create artifacts, create signed/public URLs, mutate credits, or unlock beta/production/final delivery.

The next structured-output smoke retry remains explicitly gated by:

`REEDITPRO_CONFIRM_QWEN2_5_VL_STRUCTURED_OUTPUT_SMOKE_RETRY=true`

Future retry requirements:

- build/update the CPU caller from `docker/prod/qwen2-5-vl-private-invoke-cpu-caller/Dockerfile` and current `internal_caller.py`;
- preserve fail-closed defaults before and after the retry;
- temporarily enable only the approved fixture gates needed for one structured-output smoke;
- prove `parsedJson=true`, `schemaValid=true`, non-empty object rows, non-empty text-like region rows, and `rawOutputStoredInRepo=false`;
- store only sanitized metadata evidence;
- restore the GPU service and CPU caller to fail-closed state;
- keep broad external beta, paid production, public artifacts, signed URLs, arbitrary user media, final render/export, Supabase mutation, SQL execution, frontend provider calls, and raw prompt execution blocked.
