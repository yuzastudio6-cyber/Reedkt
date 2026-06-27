# WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-RUNTIME-DEPENDENCY-SOURCE-FIX: Add Runtime Dependency Source Fix, No Media/No Push/No GCP

Use `worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_completed_with_warnings_ready_for_dockerfile_runtime_dependency_source_fix` as source evidence.

Goal: make the smallest source change to `server/workers/sound-cpu/Dockerfile` needed to retry the controlled image import proof for all 15 SOUND CPU tools.

Required source changes:
- Add an explicit `linux/amd64` SOUND CPU image lane because `audioflux` 0.1.9 bundled shared libraries were identified as `x86_64` while the current controlled image was `linux/arm64`.
- Add the minimal Debian runtime dependency `libatomic1` for `pedalboard` because the controlled image import failed on `libatomic.so.1`.
- Preserve disabled runtime flags, non-root user, fail-closed `CMD`, and the approved SOUND requirements file.

Validation:
- Run one controlled local Docker build/import proof only.
- The import proof must run with network disabled and runtime/media/worker flags set to `0`.
- Require 13/13 metadata checks and 14/14 import checks before any later owner review may consider readiness advancement.
- Remove the local image after proof.

Do not run Docker push, Docker run for product/runtime work, GCP/Cloud Run, Secret Manager, workers, routes, tools, providers, models, media processing, Supabase, SQL, artifacts, billing, beta, or production.

If the amd64 lane cannot be built locally, or if either `audioflux` or `pedalboard` still fails, stop and record the exact blocker instead of claiming runtime readiness.
