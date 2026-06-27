# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-IMAGE-RUNTIME-IMPORT-PROOF-PLAN: Plan Controlled SOUND CPU Image Import Proof, No Media/No Push/No GCP

Use `worker_runtime_jobs_sound_cpu_persistent_runtime_install_readiness_plan_completed_with_warnings_ready_for_controlled_image_runtime_import_proof_plan` as source evidence.

Goal: create the smallest no-execution plan for a later controlled local Docker image import proof that would prove the SOUND CPU image can import the 13 direct packages and alias-covered tools from the persistent image runtime without opening media, writing artifacts, pushing images, touching GCP, or enabling product tool calls.

Required source evidence:
- Cleanup-2 evidence is merged and the local validation disk blocker is resolved for the next prompt.
- `server/workers/sound-cpu/Dockerfile` exists and copies `server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt`.
- Gate 1J/PR #730 controlled local Docker build proof was accepted for planning.
- Gate 2A proves 15 controlled synthetic probes in a disposable venv, but product tool-call execution readiness remains 0.

Planning requirements:
- Identify the exact future proof command shape, but do not run Docker in this prompt.
- Future proof must be local only, use the existing SOUND CPU Dockerfile/image target, and verify package metadata/imports only.
- Future proof must keep runtime disabled by default and must not run the worker, route, media processing, FFmpeg/ffprobe, provider/model calls, Supabase, SQL, artifact writes, Docker push, Cloud Run, Secret Manager, billing, beta, or production.
- Future proof must sanitize image metadata and remove any local image/tag after proof if it builds or runs in a later prompt.

Validation:
- Run built-ins-only diagnostics for the new packet and upstream cleanup-2, Gate 2A, Docker build proof owner review, runtime execution approval refresh, and cross-chat ownership diagnostics.
- Run `git diff --check` and `git diff --cached --check`.

Supabase classification must remain: update required `no`, environment touched `no`, SQL executed `no`, migration deployed `no`, next action `none`.

Exact no-scope statement:
“No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.”
