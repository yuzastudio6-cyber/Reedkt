# WORKER_RUNTIME_JOBS SOUND CPU Runtime Beta Blocker Refresh 2 Validation Disk Register

```json worker-runtime-jobs-sound-cpu-runtime-beta-blocker-refresh-2-validation-disk-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_2_completed_with_warnings_ready_for_local_validation_disk_cleanup_2",
  "diskObservation": {
    "mount": "/Volumes/backup",
    "observedFreeSpaceGiBApprox": 19,
    "targetBeforeHydrationGiB": 25,
    "dependencyHydrationAttemptedInThisPrompt": false,
    "reasonHydrationSkipped": "docs-only packet uses Node built-ins and source evidence; disk remains below hydration threshold",
    "nodeModulesPresentInPacketWorktree": false
  },
  "requiredCleanupPolicy": {
    "deleteTrackedSource": false,
    "deleteDirtyWorktrees": false,
    "deleteWholeWorktreesFirst": false,
    "primaryTargets": ["node_modules", "dist", "dist-server", ".vite", ".turbo", ".cache", ".next", "macos_sidecars"],
    "allowedScope": "ignored_or_untracked_disposable_validation_artifacts_only",
    "skipAmbiguousTargets": true
  }
}
```
