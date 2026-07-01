# WORKER_RUNTIME_JOBS SOUND CPU Phase 75 Private Manifest Static Boundary Validation Register

```json worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-manifest-static-boundary-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-manifest-static-boundary-validation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
  "validatedStaticSource": {
    "schemaVersion": "sound-cpu-private-media-manifest-v1",
    "acceptedWorkerNames": 2,
    "acceptedJobTypes": 4,
    "privateMediaAssetIdsPresent": true,
    "plannedPrivateArtifactIdsPresent": true,
    "runtimeDefaultsAllFalse": true,
    "validationRejectsNonFalseRuntimeFlags": true
  },
  "executionState": {
    "manifestInstanceCreatedToday": false,
    "mediaProcessingApprovedToday": false,
    "artifactCreationApprovedToday": false,
    "workerDispatchApprovedToday": false
  }
}
```

The static source has the expected manifest fields and false runtime defaults. This validation does not create a new manifest instance.
