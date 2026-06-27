# REEDITPRO Local Validation Disk Cleanup 2 Artifact Inventory

```json reeditpro-local-validation-disk-cleanup-2-artifact-inventory
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "reeditpro_local_validation_disk_cleanup_2_sound_cpu_beta_readiness_completed_with_warnings_ready_for_persistent_runtime_install_readiness_plan",
  "baseline": {
    "mount": "/Volumes/backup",
    "baselineFreeGiBApprox": 19,
    "sourceBranch": "origin/codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "sourceHead": "d8fdc4df04c7b7a5c94e13d0f04eb4474b8aee2a"
  },
  "artifactScan": {
    "codexWorktreesTopLevelNodeModulesFound": 0,
    "codexWorktreesTopLevelDistFound": 0,
    "codexWorktreesTopLevelDistServerFound": 0,
    "codexWorktreesTopLevelViteTurboCacheNextFound": 0,
    "packetWorktreeMacosSidecarsFoundAndRemoved": true,
    "ambiguousTargetsSkipped": true
  },
  "removedLocalWorktrees": [
    {
      "path": "/Volumes/backup/codex-worktrees/reeditpro-worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-2",
      "clean": true,
      "headWasAncestorOfSource": true,
      "openPrForHead": false,
      "reason": "Merged PR #1133 local disposable worktree."
    },
    {
      "path": "/Volumes/backup/codex-worktrees/reeditpro-worker-runtime-jobs-sound-cpu-image-hardening-plan",
      "clean": true,
      "headWasAncestorOfSource": true,
      "openPrForHead": false,
      "reason": "Merged PR #737 local disposable worktree."
    },
    {
      "path": "/Volumes/backup/codex-worktrees/reeditpro-worker-runtime-jobs-sound-cpu-docker-build-proof-owner-review",
      "clean": true,
      "headWasAncestorOfSource": true,
      "openPrForHead": false,
      "reason": "Merged PR #734 local disposable worktree."
    }
  ],
  "preservedTargets": {
    "dirtyMainWorktree": "/Volumes/backup/REeditpro",
    "npmCacheCleaned": false,
    "privateTmpValidationDirsRemoved": false,
    "trackedSourceDeleted": false,
    "remoteBranchesDeleted": false,
    "githubPrMetadataMutated": false
  }
}
```
