# WORKER_RUNTIME_JOBS SOUND CPU Phase167 Registration Safety Register

```json worker-runtime-jobs-sound-cpu-phase167-registration-safety-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase167-registration-safety-register",
  "futureSourceChangeRules": {
    "onlyCreateRegistryPath": "server/workers/sound-cpu/disabled-route-registry.ts",
    "mayReferenceIndexPath": "server/workers/sound-cpu/index.ts",
    "mayReferenceRoutePath": "server/workers/sound-cpu/disabled-dispatch-route.ts",
    "doNotModifyExistingExpressRoutePath": "server/routes/sound-cpu-worker-routes.ts",
    "doNotRegisterExpressRoute": true,
    "doNotEnableWorkerDispatch": true,
    "doNotEnableRouteExecution": true,
    "doNotEnableClaimLeaseMutation": true,
    "doNotEnableSupabaseMutation": true,
    "doNotEnableSqlExecution": true,
    "doNotEnableMediaProcessing": true,
    "doNotEnableArtifactCreation": true
  },
  "registrySourceCreatedToday": false,
  "existingAdjacentExpressRouteMutatedToday": false,
  "ownerReviewRequiredBeforeSourceChange": true
}
```
