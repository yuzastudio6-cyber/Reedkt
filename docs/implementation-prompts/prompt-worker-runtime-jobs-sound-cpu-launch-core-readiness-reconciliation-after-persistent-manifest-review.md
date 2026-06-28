# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-READINESS-RECONCILIATION-AFTER-PERSISTENT-MANIFEST-REVIEW

```json worker-runtime-jobs-sound-cpu-launch-core-readiness-reconciliation-after-persistent-manifest-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-READINESS-RECONCILIATION-AFTER-PERSISTENT-MANIFEST-REVIEW",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_owner_review_after_source_creation_passed_with_warnings_ready_for_readiness_reconciliation_no_runtime_no_production",
  "goal": "Reconcile persistent launch-core manifests into static readiness diagnostics while preserving runtime and production blockers.",
  "acceptedManifestInputs": {
    "pythonRequirementsPath": "server/workers/sound-cpu/requirements.launch-core.txt",
    "nodeManifestPath": "package.json",
    "nodeLockfilePath": "package-lock.json",
    "acceptedPythonPins": [
      "av==17.1.0",
      "scenedetect==0.7",
      "opencv-python-headless==4.13.0.92",
      "duckdb==1.5.4",
      "polars==1.42.0",
      "opentimelineio==0.18.1"
    ],
    "acceptedNodePins": {
      "sharp": "0.35.2",
      "remotion": "4.0.484"
    }
  },
  "allowedInReconciliationGate": {
    "staticReadinessDiagnosticsUpdate": true,
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

The next gate may update static readiness code/docs to recognize persistent launch-core manifests. It must not run or unlock the tools.
