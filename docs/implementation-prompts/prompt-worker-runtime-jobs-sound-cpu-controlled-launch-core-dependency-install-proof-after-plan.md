# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-LAUNCH-CORE-DEPENDENCY-INSTALL-PROOF-AFTER-PLAN

Use `worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production` as source evidence.

Goal: perform the smallest controlled dependency install/remediation proof needed to satisfy the missing launch-core command/import/package-metadata checks. This remains no runtime/no production.

Required source evidence:
- PR #1433 must be merged at `d1dfda8e6f416d26c2195be08e422d9178322063` or a later source branch commit containing it.
- The dependency install plan must identify required Python packages `av`, `scenedetect`, `opencv-python-headless`, `duckdb`, `polars`, and `opentimelineio`.
- The dependency install plan must identify required Node package metadata dependencies `sharp` and `remotion`.
- Optional `OpenImageIO`, `PyOpenColorIO`, and `hyperframe` must remain deferred unless the proof prompt explicitly broadens scope with owner evidence.

Allowed proof scope:
- Use a clean worktree and check for same-purpose branches/PRs before creating work.
- Hydrate dependencies only for validation/proof.
- If modifying dependency manifests, stage only the explicit manifest/lockfile changes required by the controlled proof.
- Rerun `runProductionToolReadiness({ realCheckMode: true, strict: false })` or an equivalent bounded wrapper.
- Capture sanitized command/import/package-metadata proof results only.

Forbidden scope:
- Do not run runtime execution, worker execution, route execution, product tool-call execution, media processing, image processing, Remotion rendering, model download, provider/model call, deployment, Cloud Run action, Google Cloud API call, Secret Manager API call, Docker build/run/push, real-user media read, artifact delivery, Supabase mutation, SQL execution, credit mutation, Stripe processing, paid production unlock, production unlock, generated local fixture pass claim, broad dry-run pass claim, runtime readiness claim, or real-user media beta unlock.
