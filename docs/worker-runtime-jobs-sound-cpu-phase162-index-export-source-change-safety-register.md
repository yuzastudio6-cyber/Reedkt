# WORKER_RUNTIME_JOBS SOUND CPU Phase162 Index Export Source Change Safety Register

```json worker-runtime-jobs-sound-cpu-phase162-index-export-source-change-safety-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase162-index-export-source-change-safety-register",
  "futureSourceChangeRules": {
    "onlyModifyIndexPath": "server/workers/sound-cpu/index.ts",
    "onlyAddExportFrom": "server/workers/sound-cpu/disabled-dispatch-route.ts",
    "doNotModifyRouteSource": true,
    "doNotRegisterRoute": true,
    "doNotCallCreateResultFromRuntime": true,
    "doNotCallAssertFunctionOutsideStaticProof": true,
    "doNotEnableWorkerDispatch": true,
    "doNotEnableSupabaseMutation": true,
    "doNotEnableSqlExecution": true,
    "doNotEnableMediaProcessing": true,
    "doNotEnableArtifactCreation": true
  },
  "sourceChangeMadeToday": false,
  "ownerReviewRequiredBeforeSourceChange": true
}
```
