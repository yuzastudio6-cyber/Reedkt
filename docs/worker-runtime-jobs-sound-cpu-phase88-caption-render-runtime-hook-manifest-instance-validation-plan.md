# WORKER_RUNTIME_JOBS SOUND CPU Phase 88 Manifest Instance Validation Plan

```json worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-validation-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-manifest-instance-validation-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "validationPlan": {
    "useExistingPureValidator": "validateSoundCpuPrivateMediaManifest",
    "validatorSourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "validateRequiredFields": true,
    "validateAcceptedWorkerName": true,
    "validateAcceptedJobType": true,
    "validatePrivateMediaAssetIds": true,
    "validatePlannedPrivateArtifactIds": true,
    "validateRuntimeDefaultsRemainFalse": true,
    "validationOwnerReviewRequiredBeforeExecution": true
  },
  "executionState": {
    "runValidatorWithRealPayloadToday": false,
    "createManifestToday": false,
    "persistManifestToday": false,
    "openMediaFileToday": false,
    "dispatchWorkerToday": false
  }
}
```

Validation is planned against the existing pure validator. No real payload is validated in this gate.
