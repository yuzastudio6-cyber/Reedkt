# WORKER_RUNTIME_JOBS SOUND CPU Controlled Runtime Beta Preflight Validation Blocker Register

```json worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-validation-blocker-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-after-image-import-proof-validation-blocker-register",
  "blockingCategory": "dependency_hydration_disk_risk",
  "nodeModulesPresent": false,
  "safeHydratedSiblingFound": false,
  "validationVolume": "/Volumes/backup",
  "freeSpaceObservedGiBApprox": 21,
  "conservativeRetryThresholdGiB": 25,
  "npmCacheSizeObserved": "130M",
  "npmCacheVerifyRan": true,
  "macosSidecarsRemovedFromThisWorktree": 7231,
  "dependencyHydrationStarted": false,
  "reason": "The preflight requires dependency-backed checks, but starting npm ci below the retry threshold would risk another long partial hydration and ENOSPC-prone validation state."
}
```
