# WORKER_RUNTIME_JOBS-SOUND-CPU-BOUNDED-EXTERNAL-BETA-STATE-CHANGE-EXECUTION-AFTER-PLAN

Use `worker_runtime_jobs_sound_cpu_bounded_external_beta_consumer_scope_fix_completed_with_warnings_ready_for_bounded_external_beta_state_change_execution` as source evidence. The consumer scope fix is required because the bounded external beta scorecard change must include the beta readiness type boundary, summary wording, and central smoke expectations.

Goal: execute only the bounded external beta scorecard state change planned after owner review. This prompt may modify only the exact beta readiness files named by the state-change plan and must preserve no runtime/no production scope.

Required source checks:
- Re-query the state-change plan PR and require it is merged at the expected source commit.
- Re-query the scope-fix PR and require it is merged at the expected source commit.
- Re-query the consumer-scope-fix PR and require it is merged at the expected source commit.
- Confirm PR #1408 owner-review evidence is merged.
- Confirm no same-purpose or same-head PR supersedes this execution.
- Rerun `npm run prod:readiness:summary`, `npm run prod:beta:summary`, and `npm run cross-chat-tool-ownership:diagnostics` before mutation.

Allowed future files only:
- `server/beta-readiness/beta-readiness-types.ts`
- `server/beta-readiness/beta-go-no-go-policy.ts`
- `server/beta-readiness/beta-readiness-report-builder.ts`
- `server/beta-readiness/beta-readiness-checklist.ts`
- `server/smoke/beta-readiness-smoke.ts`
- `server/cli/beta-readiness-summary.ts`
- `server/smoke/production-hardening-smoke.ts`
- `server/production-hardening/production-beta-readiness-report.ts`
- A matching docs/diagnostics packet and `package.json` script if needed for proof.

Forbidden scope:
- No runtime execution, worker execution, route execution, product tool-call execution, media processing, model download, provider/model call, deployment, Cloud Run action, Google Cloud API call, Secret Manager API call, Docker build/run/push, real-user media read, artifact delivery, Supabase mutation, SQL execution, credit mutation, Stripe processing, paid production unlock, production unlock, generated local fixture pass claim, broad dry-run pass claim, or runtime readiness claim.

Stop instead of forcing the change if source lineage, duplicate checks, exact file scope, rollback proof, beta summary boundaries, or safety scans fail.
