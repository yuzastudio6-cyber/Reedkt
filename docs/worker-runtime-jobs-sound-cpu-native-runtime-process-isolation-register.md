# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Process Isolation Register

```json worker-runtime-jobs-sound-cpu-native-runtime-process-isolation-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production",
  "processIsolationPolicy": {
    "pyavLane": {
      "futureWorkerProcess": "sound-cpu-pyav-probe-process",
      "allowedToolIdsAfterFutureProof": [
        "pyav"
      ],
      "sameProcessWithOpenCvOrPySceneDetect": false,
      "mediaOpenOrDecodeAllowedToday": false
    },
    "opencvScenedetectLane": {
      "futureWorkerProcess": "sound-cpu-opencv-scenedetect-probe-process",
      "allowedToolIdsAfterFutureProof": [
        "opencv",
        "pyscenedetect"
      ],
      "sameProcessWithPyAv": false,
      "mediaOpenOrDecodeAllowedToday": false
    },
    "sharedMetadataLane": {
      "futureWorkerProcess": "sound-cpu-shared-metadata-process",
      "allowedToolIdsAfterFutureProof": [
        "duckdb",
        "polars",
        "opentimelineio"
      ],
      "sameProcessWithNativeVideoLanes": "only_after_explicit_owner_review",
      "mediaOpenOrDecodeAllowedToday": false
    }
  },
  "blockedToday": {
    "workerExecutionApprovedToday": false,
    "routeExecutionApprovedToday": false,
    "toolExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "runtimeReadinessClaimedToday": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Isolation is required before any real-user-media lane can use these native video packages.
