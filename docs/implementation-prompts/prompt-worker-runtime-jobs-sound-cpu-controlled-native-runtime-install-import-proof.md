# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NATIVE-RUNTIME-INSTALL-IMPORT-PROOF

```json worker-runtime-jobs-sound-cpu-controlled-native-runtime-install-import-proof
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NATIVE-RUNTIME-INSTALL-IMPORT-PROOF",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_native_runtime_install_proof_plan_completed_with_warnings_ready_for_controlled_install_import_proof_no_media_no_production",
  "goal": "Run a controlled local install/import proof for native/runtime-sensitive launch-core packages without media processing, rendering, worker execution, Docker/GCP, Supabase, or production unlock.",
  "proofTargets": [
    "pyav",
    "pyscenedetect",
    "opencv",
    "sharp",
    "remotion"
  ],
  "allowedInProof": {
    "pythonVenvOutsideRepo": true,
    "pipInstallFromLaunchCoreRequirements": true,
    "pythonMetadataChecks": true,
    "pythonImportOnlyChecks": true,
    "npmCiValidationOnly": true,
    "nodeMetadataChecks": true,
    "nodeImportOnlyChecks": true,
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

The proof must stop on disk pressure, metadata mismatch, import failure, media execution detection, cleanup failure, or safety scan failure.
