# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-SOURCE-PLAN-AFTER-MANIFEST-PLAN

```json worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-plan-after-manifest-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-SOURCE-PLAN-AFTER-MANIFEST-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_plan_after_proof_review_completed_with_warnings_ready_for_persistent_manifest_source_plan_no_runtime_no_production",
  "goal": "Plan the actual source mutation for persistent launch-core dependency manifests without performing the mutation in this prompt.",
  "futureSourceTargets": {
    "pythonRequirementsPath": "server/workers/sound-cpu/requirements.launch-core.txt",
    "nodeManifestPath": "package.json",
    "nodeManifestSection": "dependencies",
    "nodeLockfilePath": "package-lock.json"
  },
  "requiredFutureScope": {
    "resolveExactPythonDistributionPins": true,
    "planPackageLockMutationReview": true,
    "keepOptionalPackagesDeferred": true,
    "preserveFfmpegLibassNativeWarnings": true,
    "runtimeReadinessStillBlocked": true,
    "realUserMediaBetaStillBlocked": true,
    "paidProductionStillBlocked": true
  },
  "forbiddenScope": {
    "requirementsFileCreation": false,
    "packageJsonDependencyMutation": false,
    "packageLockMutation": false,
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
    "providerModelCall": false,
    "modelDownload": false,
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

Create a source-plan packet only. Do not create `requirements.launch-core.txt`, do not edit `package.json` dependencies, and do not mutate `package-lock.json` until a later source-mutation gate explicitly authorizes those changes.
