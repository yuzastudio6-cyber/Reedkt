# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PLAN-AFTER-CONTROLLED-PROOF

Use `worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production` as source evidence.

Goal: create a dependency installation/remediation plan for the missing launch-core checks found by the controlled proof. This remains planning-only and no runtime/no production.

Required source evidence:
- PR #1429 must be merged at `04a1c39fc645c4711fab1f888f22efaeb8279651` or a later source branch commit containing it.
- The controlled proof must show `ffmpeg` and `ffprobe` command checks passed.
- The controlled proof must show required missing launch-core dependencies: `pyav`, `pyscenedetect`, `opencv`, `duckdb`, `polars`, `opentimelineio`, `sharp`, and `remotion`.
- The controlled proof must show optional/manual blockers remain for `libass`, `openimageio`, `opencolorio`, `hyperframe`, FFmpeg LGPL-safe build review, and Revideo evaluation-only policy.

Plan requirements:
- Separate Python dependencies from Node package metadata dependencies.
- Propose the smallest safe install/remediation path that can later be proven without media processing.
- Preserve GPU/model tool exclusions and model-weight blockers.
- Preserve real-user media beta, paid production, runtime readiness, media readiness, Docker/GCP, Supabase/SQL, artifacts, provider/model calls, and worker/route execution as closed.
- Check for same-purpose branches/PRs before creating work because other chats may be active.

Forbidden scope:
- Do not install dependencies in this planning prompt.
- Do not run runtime execution, worker execution, route execution, product tool-call execution, media processing, model download, provider/model call, deployment, Cloud Run action, Google Cloud API call, Secret Manager API call, Docker build/run/push, real-user media read, artifact delivery, Supabase mutation, SQL execution, credit mutation, Stripe processing, paid production unlock, production unlock, generated local fixture pass claim, broad dry-run pass claim, or runtime readiness claim.
