# WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-PLAN

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production",
  "goal": "Create the source-level plan for isolated PyAV and OpenCV/PySceneDetect launch-core manifests before any new proof or readiness closure.",
  "allowedSourcePlanScope": {
    "docs": true,
    "diagnostics": true,
    "futureManifestPathPlanning": true,
    "requirementsFileCreation": false,
    "runtimeSourceImplementation": false,
    "pythonPackageInstall": false,
    "nodePackageInstall": false,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "realUserMediaBetaUnlock": false,
    "productionUnlock": false
  },
  "requiredFutureManifestPlan": [
    "server/workers/sound-cpu/requirements.launch-core.shared.txt",
    "server/workers/sound-cpu/requirements.launch-core.pyav.txt",
    "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Do not run the isolated proof in the source-plan prompt. The proof needs its own explicit gate after source review.
