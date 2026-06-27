# WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-RUNTIME-DEPENDENCY-FIX-PLAN: Plan Dockerfile Runtime Dependency Fix, No Media/No Push/No GCP

Use `worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_completed_with_warnings_ready_for_dockerfile_runtime_dependency_fix_plan` as source evidence.

Goal: plan the smallest Dockerfile/runtime dependency fix for the failing SOUND CPU image imports before mutating `server/workers/sound-cpu/Dockerfile`.

Known import blockers:
- `pedalboard` fails with `ImportError: libatomic.so.1: cannot open shared object file: No such file or directory`.
- `audioflux` fails with `OSError: <path>: cannot open shared object file: No such file or directory`; the path is redacted, so decide whether an additional package-layout inspection is needed before proposing a dependency.

Plan requirements:
- Do not run media, workers, routes, product tool calls, FFmpeg/ffprobe, providers/models, Supabase, SQL, artifacts, Docker push, Cloud Run, Secret Manager, billing, beta, or production.
- Prefer a minimal Debian runtime dependency plan, likely `libatomic1` for `pedalboard`, only if supported by evidence.
- Keep `audioflux` separate if its missing object is package-internal rather than a system dependency.
- Preserve fail-closed runtime flags and non-root user.
- Define a follow-up source-mutation prompt only after the plan identifies the exact safe dependency change.

Supabase classification must remain: update required `no`, environment touched `no`, SQL executed `no`, migration deployed `no`, next action `none`.

Exact scope statement:
“No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker usage was limited to controlled local image import-failure diagnostics; no Docker push or product/runtime execution was enabled.”
