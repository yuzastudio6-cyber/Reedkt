# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-IMAGE-RUNTIME-IMPORT-PROOF-FIX: Rerun Controlled Image Import Proof With Stdin-Safe Probe, No Media/No Push/No GCP

Use `worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_blocked_probe_invocation_no_output_ready_for_fix` as source evidence.

Goal: rerun the controlled local SOUND CPU image metadata/import proof with a stdin-safe probe invocation. The previous build passed and the temporary image was removed, but the Docker run did not emit JSON because stdin was not attached. Do not claim import readiness until the container emits JSON proving the 13 metadata packages and 14 import modules passed.

Allowed fix shape:
- Rebuild the same temporary local image only if it is absent.
- Run the metadata/import probe with `docker run -i --rm --network=none` or an equivalent `python -c` invocation that cannot lose the probe body.
- Keep `REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0`, `REEDITPRO_WORKER_EXECUTION_ENABLED=0`, and `REEDITPRO_MEDIA_PROCESSING_ENABLED=0`.
- Inspect sanitized image metadata and remove the local image/tag after the proof.

Forbidden in the fix:
- Docker push, Docker run for worker execution, GCP/Cloud Run/Secret Manager, worker/route/tool execution, media processing, FFmpeg/ffprobe, model/provider calls, Supabase, SQL, artifact writes, signed/public URLs, billing, beta, production, or readiness unlocks.

Stop instead of forcing if Docker, disk, package install, imports, image cleanup, or safety scan fails.

Supabase classification must remain: update required `no`, environment touched `no`, SQL executed `no`, migration deployed `no`, next action `none`.

Exact scope statement:
“No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker usage was limited to the controlled local image metadata/import proof fix; no Docker push or product/runtime execution was enabled.”
