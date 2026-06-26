# SOUND-RUNTIME-MEDIA-GATE-2AJ: Runtime Guard Source Hardening, No Execution

Create a scoped source-hardening packet only after `worker_runtime_jobs_sound_cpu_runtime_guard_hardening_owner_review_passed_with_warnings_ready_for_runtime_guard_source_hardening`.

Allowed scope: runtime guard source hardening for disabled-by-default assertions, resolver/import policy documentation, no-execution regression diagnostics, docs, prompts, diagnostics, and package scripts. Keep source edits narrowly limited to the SOUND CPU runtime guard modules if they are required by the hardening decision.

This prompt must not dispatch workers, execute workers, execute tools, execute routes, open or process media, run FFmpeg/ffprobe, run Docker build/run/push, call GCP/Cloud Run/Secret Manager, touch Supabase, execute SQL, create artifacts, create signed/public URLs, call providers/models, unlock beta, unlock production, claim `generated_local_fixture_passed`, claim `dry_run_passed`, or claim worker/runtime/media/beta/production readiness.

Required source evidence: PR #954 merged at `4707fd5e5c20ce0ec0fdda093fdf4fcb1648ce6a`, Gate 2AI diagnostics passing, and this WORKER_RUNTIME_JOBS owner-review decision.
