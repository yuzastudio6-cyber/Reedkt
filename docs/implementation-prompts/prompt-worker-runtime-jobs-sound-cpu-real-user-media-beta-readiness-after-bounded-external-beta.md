# WORKER_RUNTIME_JOBS-SOUND-CPU-REAL-USER-MEDIA-BETA-READINESS-AFTER-BOUNDED-EXTERNAL-BETA

Use `worker_runtime_jobs_sound_cpu_bounded_external_beta_state_change_execution_completed_with_warnings_bounded_external_beta_scorecard_enabled_no_runtime_no_production` as source evidence.

Goal: plan real-user media beta readiness after the bounded external beta scorecard state change. This is planning only and must not execute runtime paths, process media, deploy, mutate Supabase, create artifacts, or unlock paid production.

Required checks:
- Re-query the bounded external beta state-change PR and require it is merged.
- Run `npm run prod:beta:summary`, `npm run prod:readiness:summary`, and `npm run cross-chat-tool-ownership:diagnostics`.
- Confirm bounded external beta scorecard is true while real-user media beta and paid production remain false.
- Identify the exact remaining real-user media beta blockers before proposing any future execution.

Forbidden scope:
- No runtime execution, worker execution, route execution, product tool-call execution, media processing, model download, provider/model call, deployment, Cloud Run action, Google Cloud API call, Secret Manager API call, Docker build/run/push, real-user media read, artifact delivery, Supabase mutation, SQL execution, credit mutation, Stripe processing, paid production unlock, production unlock, generated local fixture pass claim, broad dry-run pass claim, or runtime readiness claim.
