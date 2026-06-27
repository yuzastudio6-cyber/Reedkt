# WORKER_RUNTIME_JOBS-SOUND-CPU-PERSISTENT-RUNTIME-INSTALL-READINESS-PLAN: Plan Persistent SOUND CPU Runtime Install Readiness, No Execution

Use `reeditpro_local_validation_disk_cleanup_2_sound_cpu_beta_readiness_completed_with_warnings_ready_for_persistent_runtime_install_readiness_plan` as source evidence.

Goal: create the smallest non-duplicate plan that can move the 15 proven SOUND CPU tools from package/synthetic-proof evidence toward persistent runtime install readiness without enabling product tool calls, worker execution, route execution, media processing, Docker/GCP, Supabase/SQL, artifacts, billing, beta, or production.

Required source evidence:
- PR #1133 cleanup-blocker refresh is merged at `d8fdc4df04c7b7a5c94e13d0f04eb4474b8aee2a`.
- Cleanup-2 evidence shows `/Volumes/backup` at or above the 25 GiB local validation threshold.
- Gate 2A and PR #1131 already prove 15 controlled synthetic tool-call probes; do not rerun them.
- Current authoritative counts remain: 15 package/synthetic-proof-ready tools, 0 persistent runtime installs, 0 product-callable tools, 0 external beta readiness, and 0 production readiness.

Implementation scope:
- Docs/diagnostics-only unless a later prompt explicitly authorizes controlled install work.
- Identify the correct persistent runtime target for the 15 tools: Docker image, local worker runtime, tool-call route surface, or another repo-owned runtime boundary.
- Reconcile existing Docker build proof, requirements source, no-media/no-artifact package proof, synthetic tool-call proof, runtime guard/source, worker dispatch, route readiness, Supabase/artifact/billing/compliance, and beta readiness docs.
- Select exactly one next non-duplicate gate that would make product-callable tool execution readiness more true.
- Do not claim persistent runtime install readiness or product-callable tool execution readiness unless current evidence proves it.

Validation:
- Run built-ins-only diagnostics for the new packet and the cleanup-2, tool-call readiness, Gate 2A, package proof retry, runtime execution approval refresh, and cross-chat ownership diagnostics.
- Run `git diff --check` and `git diff --cached --check`.
- Run dependency hydration only if the prompt explicitly requests it, `/Volumes/backup` remains at or above the cleanup threshold, and no runtime/tool/media execution path is invoked.

Supabase classification must remain: update required `no`, environment touched `no`, SQL executed `no`, migration deployed `no`, next action `none`.

Exact no-scope statement:
“No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled.”
