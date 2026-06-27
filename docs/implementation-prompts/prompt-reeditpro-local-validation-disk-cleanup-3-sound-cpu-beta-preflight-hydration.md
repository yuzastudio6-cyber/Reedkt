# REEDITPRO-LOCAL-VALIDATION-DISK-CLEANUP-3-SOUND-CPU-BETA-PREFLIGHT-HYDRATION

Use `worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_after_image_import_proof_blocked_dependency_hydration_disk_risk` as source evidence.

Goal: free enough validation disk to rerun the SOUND CPU controlled runtime beta preflight after the successful image import proof.

Allowed:
- Conservative cleanup of ignored disposable validation artifacts under `/Volumes/backup/codex-worktrees`.
- `npm cache verify`, and `npm cache clean --force` only if needed.
- Dependency hydration only after the validation volume reaches at least 25 GiB free.
- Static diagnostics, readiness summaries, lint, typecheck, build checks, and diff checks.

Forbidden:
- Deleting dirty active worktrees or ambiguous worktrees used by other chats.
- Docker build/run/push.
- GCP/Cloud Run/Secret Manager.
- Worker dispatch, worker execution, route execution, product tool execution, media processing, Supabase, SQL, artifact creation, signed/public URLs, credits, Stripe, beta unlock, production unlock, raw prompt execution, final render, or export.

If cleanup cannot safely reach the retry threshold, stop and report the smallest safe next cleanup target. If hydration or checks fail after cleanup, record the exact blocker and do not unlock beta.
