# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-NATIVE-RUNTIME-SOURCE-INSTALL-REVIEW

```json worker-runtime-jobs-sound-cpu-launch-core-native-runtime-source-install-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-NATIVE-RUNTIME-SOURCE-INSTALL-REVIEW",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_source_install_review_after_readiness_reconciliation_passed_with_warnings_ready_for_native_runtime_source_install_review_no_runtime_no_production",
  "goal": "Review native/runtime-sensitive source-install blockers for remaining launch-core packages without enabling runtime, media, Docker/GCP, Supabase, or production.",
  "reviewTargets": [
    "pyav",
    "pyscenedetect",
    "opencv",
    "sharp",
    "remotion"
  ],
  "alreadyClosedSourceInstallReview": [
    "duckdb",
    "polars",
    "opentimelineio"
  ],
  "separateMissingLaunchCoreTargets": [
    "ffmpeg",
    "ffprobe",
    "hyperframe",
    "libass"
  ],
  "allowedInNativeRuntimeSourceInstallReview": {
    "staticSourceReview": true,
    "manifestParsing": true,
    "dependencyHydrationForValidationOnly": true,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "imageProcessing": false,
    "remotionRendering": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "externalBetaUnlock": false,
    "productionUnlock": false
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

This follow-up should inspect native/runtime concerns and stop rather than approve anything unsafe.
