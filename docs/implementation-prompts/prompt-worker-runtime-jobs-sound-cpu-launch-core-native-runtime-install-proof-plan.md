# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-NATIVE-RUNTIME-INSTALL-PROOF-PLAN

```json worker-runtime-jobs-sound-cpu-launch-core-native-runtime-install-proof-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-NATIVE-RUNTIME-INSTALL-PROOF-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_native_runtime_source_install_review_completed_with_warnings_ready_for_native_runtime_install_proof_plan_no_runtime_no_production",
  "goal": "Plan controlled install/import proof for native/runtime-sensitive launch-core packages without media execution, worker execution, Docker/GCP, Supabase, or production unlock.",
  "proofTargets": [
    "pyav",
    "pyscenedetect",
    "opencv",
    "sharp",
    "remotion"
  ],
  "separateMissingLaunchCoreTargets": [
    "ffmpeg",
    "ffprobe",
    "hyperframe",
    "libass"
  ],
  "allowedInProofPlan": {
    "staticSourceReview": true,
    "manifestParsing": true,
    "dependencyHydrationForValidationOnly": true,
    "importOnlyProofPlanning": true,
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
    "realUserMediaBetaUnlock": false,
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

This follow-up should plan exact install/import proof boundaries and stop if any proof would require media, rendering, or runtime execution.
