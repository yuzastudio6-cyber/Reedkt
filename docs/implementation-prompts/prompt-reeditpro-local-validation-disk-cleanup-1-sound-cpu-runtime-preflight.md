# REEDITPRO-LOCAL-VALIDATION-DISK-CLEANUP-1: Free Validation Disk For SOUND CPU Runtime Preflight, No Runtime Execution

Use `worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_completed_with_warnings_ready_for_validation_disk_cleanup_and_controlled_runtime_preflight` as source evidence. Free disk only from disposable ignored validation artifacts so the SOUND CPU controlled runtime beta preflight can later hydrate dependencies safely.

Do not touch `/Volumes/backup/REeditpro` tracked source, PR metadata, Supabase, SQL, Docker build/run/push, GCP/Cloud Run/Secret Manager, workers, routes, tools, media processing, FFmpeg/ffprobe, provider/model calls, model weights, artifacts, signed/public URLs, credit/Stripe mutation, beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handlers.

Record baseline `df -h` and a shallow inventory before deletion. Prefer deleting only ignored/untracked validation artifacts under disposable worktrees: `node_modules`, `dist`, `dist-server`, `.vite`, `.turbo`, `.cache`, `.next`, and macOS `._*` sidecars. Before deleting any whole worktree, prove it is clean, inactive, disposable, and not being used by another chat; whole-worktree deletion is a last resort only.

After cleanup, report free space, what was removed, what was skipped, package-lock status if inspected, and whether dependency hydration can safely be retried in a future controlled preflight. Do not run the runtime beta preflight in this cleanup prompt unless a later prompt explicitly asks for it.
