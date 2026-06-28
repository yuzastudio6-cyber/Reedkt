# WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-CREATION

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-CREATION",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_plan_completed_with_warnings_ready_for_source_creation_no_media_no_production",
  "goal": "Create isolated launch-core manifest source files exactly as planned, without installing packages or executing media/runtime paths.",
  "allowedSourceCreationScope": {
    "createRequirementsFiles": true,
    "updateDocs": true,
    "updateDiagnostics": true,
    "packageScriptForDiagnostics": true,
    "pythonPackageInstall": false,
    "nodePackageInstall": false,
    "runtimeSourceImplementation": false,
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
  "requiredFilesToCreate": {
    "server/workers/sound-cpu/requirements.launch-core.shared.txt": [
      "duckdb==1.5.4",
      "polars==1.42.0",
      "opentimelineio==0.18.1"
    ],
    "server/workers/sound-cpu/requirements.launch-core.pyav.txt": [
      "av==17.1.0"
    ],
    "server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt": [
      "scenedetect==0.7",
      "opencv-python-headless==4.13.0.92"
    ]
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

Do not run the isolated install/import proof in the source-creation gate; create source and hand off to a proof gate.
