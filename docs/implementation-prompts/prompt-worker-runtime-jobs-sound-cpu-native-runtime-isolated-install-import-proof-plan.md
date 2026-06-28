# WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-ISOLATED-INSTALL-IMPORT-PROOF-PLAN

```json worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-ISOLATED-INSTALL-IMPORT-PROOF-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_owner_review_passed_with_warnings_ready_for_isolated_install_import_proof_plan_no_install_no_media_no_production",
  "goal": "Plan the controlled isolated install/import proof for split native runtime manifests without executing package installation in the planning gate.",
  "allowedPlanScope": {
    "docs": true,
    "diagnostics": true,
    "proofCommandPlanning": true,
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

The proof plan should define commands and safety gates only. The actual install/import proof needs its own explicit execution prompt.
