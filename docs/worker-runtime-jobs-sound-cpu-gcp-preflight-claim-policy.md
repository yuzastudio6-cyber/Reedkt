# WORKER_RUNTIME_JOBS SOUND CPU GCP Preflight Claim Policy

```json worker-runtime-jobs-sound-cpu-gcp-preflight-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-preflight-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_read_only_gcp_preflight_completed_with_blockers_ready_for_foundation_resource_creation_plan",
  "allowedClaims": {
    "readOnlyGcpPreflightCompleted": true,
    "projectAccessible": true,
    "artifactRepositoryExists": true,
    "requiredCoreApisObserved": true,
    "missingServiceAccountIdentified": true,
    "missingImagesIdentified": true,
    "missingCloudRunJobsIdentified": true
  },
  "forbiddenClaims": [
    "Google Cloud resources were created",
    "Cloud Run jobs were deployed",
    "Cloud Run jobs executed",
    "Docker images were built",
    "Docker images were pushed",
    "Docker images were run",
    "SOUND CPU tools are deployed in Google Cloud",
    "external beta ready",
    "production ready",
    "worker ready",
    "runtime ready",
    "media ready"
  ],
  "acceptedForToday": {
    "readOnlyGoogleCloudInspectionCalls": "yes",
    "gcpFoundationResourceCreationPlanning": "yes",
    "googleCloudMutation": "no",
    "secretManagerMutation": "no",
    "cloudRunDeploy": "no",
    "cloudRunExecute": "no",
    "dockerBuild": "no",
    "dockerPush": "no",
    "dockerRun": "no",
    "workerExecution": "no",
    "routeExecution": "no",
    "mediaProcessing": "no",
    "supabaseSql": "no",
    "artifactWrite": "no",
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

The read-only GCP calls are not readiness proof. They are a current-state audit used to select the next safe mutation gate.
