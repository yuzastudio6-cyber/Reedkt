# WORKER_RUNTIME_JOBS-SOUND-CPU-EXTERNAL-BETA-STATE-CHANGE-PLAN-AFTER-OWNER-REVIEW

Use `worker_runtime_jobs_sound_cpu_external_beta_owner_review_after_deployment_security_cost_reconciliation_passed_with_warnings_ready_for_external_beta_state_change_plan_no_unlock` as source evidence.

Goal: plan a bounded external beta state change after owner review. This prompt may propose the exact future state-change artifact, rollback conditions, stop conditions, and verification plan, but it must not execute runtime paths, deploy, process media, or enable paid production.

Scope shorthand: no execution/no production.

Required checks:
- Re-query the external beta owner-review PR and require it is merged at the expected source commit.
- Rerun `npm run prod:readiness:summary`, `npm run prod:beta:summary`, and `npm run cross-chat-tool-ownership:diagnostics`.
- Confirm no same-purpose or same-head PR supersedes this state-change plan.
- Define the narrowest possible external beta state-change plan, including rollback, stop conditions, support/observability, and no paid production scope.

Allowed scope:
- Docs/diagnostics state-change planning only.
- A future explicit state-change execution prompt if and only if the plan proves the exact files, flags, and rollback.

Forbidden scope:
- No runtime execution, worker execution, route execution, product tool-call execution, media processing, model download, provider/model call, deployment, Cloud Run action, Google Cloud API call, Secret Manager API call, Docker build/run/push, real-user media read, artifact delivery, Supabase mutation, SQL execution, credit mutation, Stripe processing, paid production unlock, production unlock, generated local fixture pass claim, broad dry-run pass claim, or runtime readiness claim.

Expected decision if planning succeeds without execution:
`worker_runtime_jobs_sound_cpu_external_beta_state_change_plan_after_owner_review_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution`
