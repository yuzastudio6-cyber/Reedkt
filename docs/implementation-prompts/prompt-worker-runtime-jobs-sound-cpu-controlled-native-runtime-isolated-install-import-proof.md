# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NATIVE-RUNTIME-ISOLATED-INSTALL-IMPORT-PROOF

```json worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NATIVE-RUNTIME-ISOLATED-INSTALL-IMPORT-PROOF",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_plan_completed_with_warnings_ready_for_controlled_isolated_install_import_proof_no_media_no_production",
  "goal": "Run the controlled isolated install/import proof for the split native runtime manifests without media execution or production readiness unlock.",
  "allowedProofScope": {
    "temporaryPythonVenvsOutsideRepo": true,
    "pipInstallFromSplitManifests": true,
    "metadataVersionChecks": true,
    "isolatedNativeImports": true,
    "mediaFileOpen": false,
    "decodeEncode": false,
    "sceneDetectionExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "realUserMediaBetaUnlock": false,
    "productionUnlock": false
  },
  "proofTargets": [
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

If any isolated lane emits a duplicate native class warning, stop and classify the blocker instead of unlocking beta.
