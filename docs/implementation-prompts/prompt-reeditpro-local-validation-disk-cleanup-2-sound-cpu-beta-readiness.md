# REEDITPRO-LOCAL-VALIDATION-DISK-CLEANUP-2: Free Validation Disk For SOUND CPU Beta Readiness Validation, No Runtime Execution

Use `worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_2_completed_with_warnings_ready_for_local_validation_disk_cleanup_2` as source evidence.

Goal: free enough local validation disk for dependency-backed SOUND CPU beta-readiness validation without touching tracked source, dirty worktrees, PR metadata, Supabase, SQL, Docker/GCP, workers/routes/tools, media, model weights, artifacts, billing, beta, or production.

Required cleanup scope:
- Record baseline `df -h /Volumes/backup` and shallow artifact inventory under `/Volumes/backup/codex-worktrees`.
- Remove only ignored/untracked disposable validation artifacts such as `node_modules`, `dist`, `dist-server`, `.vite`, `.turbo`, `.cache`, `.next`, and macOS `._*` sidecars.
- Before deleting any artifact parent, inspect `git status --short` and skip ambiguous targets.
- Do not delete whole worktrees unless artifact/cache cleanup cannot reach the target and the worktree is clean, inactive, and disposable.
- Target at least `25 GiB` free on `/Volumes/backup` before dependency hydration.

After cleanup, rerun only dependency-backed validation requested by the next SOUND CPU beta-readiness prompt. Do not run tool calls, workers, routes, media processing, Supabase, SQL, Docker/GCP, provider/model calls, artifact creation, beta unlock, or production unlock in the cleanup prompt.

Supabase classification must remain: update required `no`, environment touched `no`, SQL executed `no`, migration deployed `no`, next action `none`.

Exact no-scope statement:
“No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Cleanup is limited to ignored or untracked disposable validation artifacts.”
