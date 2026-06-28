# WORKER_RUNTIME_JOBS-SOUND-CPU-REAL-USER-MEDIA-BETA-BOUNDARY-CLOSURE-AFTER-EXTERNAL-BETA-RECONCILIATION

Use `worker_runtime_jobs_sound_cpu_external_beta_readiness_reconciliation_after_beta_support_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_specific_blocker_closure` as source evidence.

Goal: close the real-user-media beta boundary for planning only after external beta readiness reconciliation. This must not process media, read uploads, create signed URLs, write artifacts, mutate Supabase, call providers, run workers/routes/tools, or unlock external beta.

Scope shorthand: no media execution/no external beta.

Required checks:
- Re-query the external beta reconciliation PR and require it is merged at the expected source commit.
- Confirm PR #1381, #1377, and #1373 evidence remains present.
- Confirm live `npm run prod:beta:summary` still reports external beta false and real-user media beta false before any planning update.
- Confirm no same-purpose or same-head PR supersedes this prompt.
- Inspect no-real-user-media boundary evidence, artifact delivery evidence, Supabase/SQL evidence, security/cost/support evidence, and product beta readiness evidence.

Allowed scope:
- Docs/diagnostics owner review only.
- Planning-only closure of the real-user-media beta boundary.
- A next blocker-specific prompt if real-user media beta remains closed.

Forbidden scope:
- No media file open, upload read, storage object read, signed URL creation, public artifact creation, private artifact write, FFmpeg/ffprobe, pydub media operation, audioread file open, model media path, worker execution, route execution, product tool-call execution, provider/model call, Supabase mutation, SQL execution, billing mutation, Stripe processing, deployment, internal beta unlock, external beta unlock, production unlock, generated local fixture pass claim, broad dry-run pass claim, or runtime readiness claim.

Expected decision if planning closure succeeds without unlocking:
`worker_runtime_jobs_sound_cpu_real_user_media_beta_boundary_closure_after_external_beta_reconciliation_completed_with_warnings_ready_for_external_beta_blocker_reconciliation_no_external_beta`

If real-user media beta unexpectedly appears allowed by live readiness, do not unlock external beta in this prompt. Record the evidence and create a separate owner-reviewed unlock prompt.
