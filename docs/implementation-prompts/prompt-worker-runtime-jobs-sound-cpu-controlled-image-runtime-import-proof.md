# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-IMAGE-RUNTIME-IMPORT-PROOF: Run Controlled Local SOUND CPU Image Import Proof, No Media/No Push/No GCP

Use `worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof` as source evidence.

Goal: run exactly one controlled local Docker image metadata/import proof for `server/workers/sound-cpu/Dockerfile` and the SOUND requirements file. The proof may build a temporary local image and run a metadata/import-only Python probe inside that image. It must not run a worker, route, product tool call, media operation, FFmpeg/ffprobe, provider/model call, Supabase, SQL, artifact write, Docker push, Cloud Run, Secret Manager, billing, beta, or production action.

Required checks before mutation:
- Re-query the source branch and require it contains the controlled image runtime import proof plan decision.
- Confirm no same-purpose branch or open PR exists.
- Confirm `server/workers/sound-cpu/Dockerfile` still disables `REEDITPRO_SOUND_CPU_RUNTIME_ENABLED`, `REEDITPRO_WORKER_EXECUTION_ENABLED`, and `REEDITPRO_MEDIA_PROCESSING_ENABLED`.
- Confirm Docker is available and enough local disk remains; if not, stop with an exact blocker instead of forcing.

Allowed proof shape:
- `docker build --progress=plain --file server/workers/sound-cpu/Dockerfile --tag reeditpro-sound-cpu:controlled-image-runtime-import-proof-local .`
- `docker run --rm --network=none` with all runtime/media/worker flags set to `0`, executing only an inline Python metadata/import script for the 13 direct packages, `scipy.signal`, and the two alias-covered tools by package coverage.
- `docker image inspect` only for sanitized image ID/size/config evidence.
- `docker image rm reeditpro-sound-cpu:controlled-image-runtime-import-proof-local` after proof.

The proof must not open media, create artifacts, write outputs outside sanitized docs, call routes/workers/tools/providers, touch Supabase, execute SQL, push images, call GCP/Cloud Run, or unlock beta/production.

Supabase classification must remain: update required `no`, environment touched `no`, SQL executed `no`, migration deployed `no`, next action `none`.

Exact no-scope statement:
“No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker usage was limited to the controlled local image metadata/import proof; no Docker push or product/runtime execution was enabled.”
