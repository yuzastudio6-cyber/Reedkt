# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-SOURCE-CREATION-AFTER-SOURCE-PLAN

```json worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-creation-after-source-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-SOURCE-CREATION-AFTER-SOURCE-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_source_plan_after_manifest_plan_completed_with_warnings_ready_for_persistent_manifest_source_creation_no_runtime_no_production",
  "goal": "Create the persistent launch-core dependency manifests and lockfile update with validation-only hydration, no runtime/no production.",
  "sourceCreationTargets": {
    "pythonRequirementsPath": "server/workers/sound-cpu/requirements.launch-core.txt",
    "nodeManifestPath": "package.json",
    "nodeManifestSection": "dependencies",
    "nodeLockfilePath": "package-lock.json"
  },
  "allowedInSourceCreationGate": {
    "requirementsFileCreation": true,
    "packageJsonDependencyMutation": true,
    "packageLockMutationForApprovedDependencies": true,
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

Only this later source-creation gate may create `requirements.launch-core.txt`, add approved `sharp` and `remotion` dependency entries, and update `package-lock.json` for that approved dependency closure. It still must not execute runtime/media/tool paths or unlock beta/production.
