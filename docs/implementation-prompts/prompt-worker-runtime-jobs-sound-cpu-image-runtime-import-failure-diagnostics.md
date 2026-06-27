# WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-RUNTIME-IMPORT-FAILURE-DIAGNOSTICS: Capture Sanitized Import Failure Detail, No Media/No Push/No GCP

Use `worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics` as source evidence.

Goal: capture sanitized error detail for the failing `audioflux` and `pedalboard` imports inside the SOUND CPU local image path. Do not guess or change Dockerfile dependencies until the failure detail is known.

Allowed diagnostic shape:
- Rebuild the same temporary local image only if it is absent.
- Run a networkless metadata/import diagnostic for `audioflux` and `pedalboard` only, using `docker run -i --rm --network=none` or an equivalent stdin-safe invocation.
- Capture sanitized exception class, sanitized message, and top-level missing-library/module hints only.
- Inspect sanitized image metadata and remove the local image/tag after diagnostics.

Forbidden:
- Media file open, pydub media operation, FFmpeg/ffprobe execution, worker/route/tool execution, provider/model call, Supabase, SQL, artifact write, Docker push, Cloud Run, Secret Manager, billing, beta, production, or readiness unlock.

Stop instead of forcing if Docker, disk, package install, diagnostics, cleanup, or safety scan fails.

Supabase classification must remain: update required `no`, environment touched `no`, SQL executed `no`, migration deployed `no`, next action `none`.

Exact scope statement:
“No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker usage was limited to controlled local image import-failure diagnostics; no Docker push or product/runtime execution was enabled.”
