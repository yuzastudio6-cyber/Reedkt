# WORKER_RUNTIME_JOBS SOUND CPU Cloud Worker Claim Policy

```json worker-runtime-jobs-sound-cpu-cloud-worker-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-cloud-worker-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_cloud_worker_runtime_plan_completed_with_warnings_ready_for_cloud_worker_runtime_owner_review_no_deploy",
  "allowedClaims": {
    "allFifteenToolsClassifiedCpuOnly": true,
    "soundCpuCloudRunJobTemplatesExist": true,
    "soundCpuArtifactRegistryImageNamesExist": true,
    "soundCpuDeployExamplesExist": true,
    "runtimeDisabledByDefault": true,
    "supabaseNoopClassification": true
  },
  "forbiddenClaims": [
    "tools are deployed in Google Cloud",
    "Cloud Run jobs exist in Google Cloud",
    "Cloud Run jobs executed",
    "Docker images were pushed",
    "Docker images were run",
    "worker execution ready",
    "route execution ready",
    "media processing ready",
    "external beta ready",
    "production ready",
    "generated_local_fixture_passed",
    "dry_run_passed"
  ],
  "acceptedForToday": {
    "cloudWorkerRuntimeOwnerReview": "yes",
    "readOnlyGcpPreflightPlanning": "yes",
    "dockerBuild": "no",
    "dockerPush": "no",
    "dockerRun": "no",
    "gcloudMutation": "no",
    "cloudRunDeploy": "no",
    "cloudRunExecute": "no",
    "workerExecution": "no",
    "routeExecution": "no",
    "mediaProcessing": "no",
    "supabaseSql": "no",
    "externalBetaUnlock": "no",
    "productionUnlock": "no"
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

This policy exists to prevent the Cloud template mapping from being misread as deployment or runtime readiness.
