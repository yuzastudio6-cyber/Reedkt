# WORKER_RUNTIME_JOBS-SOUND-CPU-INTERNAL-BETA-NEXT-SCOPE-REVIEW-AFTER-DRY-RUN

Use `worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_owner_review_after_execution_passed_with_warnings_ready_for_internal_beta_next_scope_review_no_external_beta` as source evidence.

Goal: decide the smallest safe next internal-beta scope after the accepted bounded synthetic dry-run evidence. This prompt must not unlock external beta or production.

Required checks:
- Re-query the dry-run owner-review PR and require it is merged at the expected source commit.
- Confirm no duplicate next-scope review PR supersedes it.
- Re-run `npm run prod:readiness:summary` and `npm run prod:beta:summary`.
- Confirm the source owner review accepted 15 SOUND CPU synthetic descriptors with 0 failures for internal scope review only.
- Inspect adjacent worker/runtime/tool-call/Supabase/artifact/billing lanes in the repo before choosing a next step.
- Stop rather than force readiness if external beta, real-user media beta, paid production, production, runtime readiness, media readiness, artifacts, Supabase, SQL, billing, deployment, worker execution, or route execution would be implied without source evidence.

Allowed scope:
- Docs/diagnostics owner review only.
- Choose the next internal beta blocker-closure prompt or evidence lane.
- No product-wide external beta, real-user media beta, paid production, production, product tool-call execution, worker execution, route execution, media processing, artifact delivery, Supabase mutation, SQL execution, provider/model call, credit mutation, Stripe processing, deployment, runtime readiness, generated local fixture pass claim, or broad dry-run pass claim.

Expected decision if the next scope review passes:
`worker_runtime_jobs_sound_cpu_internal_beta_next_scope_review_after_dry_run_passed_with_warnings_ready_for_next_blocker_closure_no_external_beta`
