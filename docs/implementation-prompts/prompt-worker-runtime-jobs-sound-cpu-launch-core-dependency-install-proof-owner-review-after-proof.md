# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PROOF-OWNER-REVIEW-AFTER-PROOF

Use `worker_runtime_jobs_sound_cpu_controlled_launch_core_dependency_install_proof_after_plan_passed_required_checks_with_warnings_ready_for_dependency_install_proof_owner_review_no_runtime_no_production` as source evidence.

Goal: review the controlled launch-core dependency install proof and decide the next persistent-manifest or packaging gate. This remains no runtime/no production.

Required source evidence:
- PR #1435 must be merged at `70c37bbee038b46bb67785e16d489a506ec4b1df` or a later source branch commit containing it.
- The proof must show required Python imports passed in a disposable venv.
- The proof must show required Node package metadata checks passed after the metadata resolver fallback fix.
- The proof must record no package-lock mutation, no staged `node_modules`, and temp venv removal.
- The proof must preserve warnings for PyAV/OpenCV native-library overlap, libass filter inspection, FFmpeg LGPL-safe build review, optional OpenImageIO/OpenColorIO/Hyperframe deferral, Revideo evaluation-only status, and missing persistent manifests.

Review requirements:
- Decide whether persistent Python worker requirement pins should be added in a later gate.
- Decide whether `sharp` and `remotion` should be added to the appropriate package manifest in a later gate.
- Keep real-user media beta, paid production, runtime readiness, media readiness, Docker/GCP, Supabase/SQL, artifacts, provider/model calls, and worker/route execution closed.
- Check for same-purpose branches/PRs before creating work because other chats may be active.

Forbidden scope:
- Do not run runtime execution, worker execution, route execution, product tool-call execution, media processing, image processing, Remotion rendering, model download, provider/model call, deployment, Cloud Run action, Google Cloud API call, Secret Manager API call, Docker build/run/push, real-user media read, artifact delivery, Supabase mutation, SQL execution, credit mutation, Stripe processing, paid production unlock, production unlock, generated local fixture pass claim, broad dry-run pass claim, runtime readiness claim, or real-user media beta unlock.
