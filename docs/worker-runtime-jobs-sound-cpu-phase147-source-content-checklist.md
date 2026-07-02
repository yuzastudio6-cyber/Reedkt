# WORKER_RUNTIME_JOBS SOUND CPU Phase 147 Source Content Checklist

```json worker-runtime-jobs-sound-cpu-phase147-source-content-checklist
{
  "label": "worker-runtime-jobs-sound-cpu-phase147-source-content-checklist",
  "futureSourcePath": "server/workers/sound-cpu/dispatch-contract.ts",
  "requiredFutureContent": {
    "versionConstant": true,
    "allowedWorkerNames": true,
    "allowedImageNames": true,
    "allowedJobTypes": true,
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "runtimeFlagsDefaultFalse": true,
    "disabledEnvelopeBuilder": true,
    "noDispatchSideEffects": true
  },
  "prohibitedFutureContent": {
    "workerDispatch": false,
    "routeExecution": false,
    "toolExecution": false,
    "providerCall": false,
    "modelCall": false,
    "supabaseWrite": false,
    "sqlExecution": false,
    "mediaFileOpen": false,
    "artifactWrite": false,
    "signedUrlCreation": false,
    "publicArtifactCreation": false,
    "betaUnlock": false,
    "productionUnlock": false
  }
}
```

The actual Phase148 source must be reviewable as static TypeScript contract code, not runtime orchestration.
