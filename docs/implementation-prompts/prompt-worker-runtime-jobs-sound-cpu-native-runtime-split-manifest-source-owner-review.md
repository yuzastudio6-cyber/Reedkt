# WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-OWNER-REVIEW",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_creation_completed_with_warnings_ready_for_source_owner_review_no_install_no_media_no_production",
  "goal": "Review isolated native runtime manifest source files before any isolated install/import proof planning.",
  "reviewScope": {
    "docs": true,
    "diagnostics": true,
    "manifestSourceReview": true,
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
  "requiredSourceFiles": [
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

If this review passes, plan the controlled isolated install/import proof. Do not run the proof in the review prompt.
