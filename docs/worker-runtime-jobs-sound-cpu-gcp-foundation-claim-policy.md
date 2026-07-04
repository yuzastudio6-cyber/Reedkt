# WORKER_RUNTIME_JOBS SOUND CPU GCP Foundation Claim Policy

```json worker-runtime-jobs-sound-cpu-gcp-foundation-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-foundation-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_gcp_foundation_resource_creation_result_completed_with_blockers_ready_for_iam_role_binding_plan",
  "allowedClaims": {
    "serviceAccountCreated": true,
    "serviceAccountExists": true,
    "serviceAccountReadyForMinimalIamPlanning": true,
    "preflightMissingServiceAccountBlockerClosed": true
  },
  "forbiddenClaims": [
    "SOUND CPU tools are deployed in Google Cloud",
    "Cloud Run jobs were deployed",
    "Cloud Run jobs executed",
    "Docker images were built",
    "Docker images were pushed",
    "Docker images were run",
    "IAM is complete",
    "external beta ready",
    "production ready",
    "worker ready",
    "runtime ready",
    "media ready"
  ],
  "acceptedForToday": {
    "serviceAccountCreation": "yes",
    "serviceAccountReadback": "yes",
    "projectIamRoleBinding": "no",
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

The only readiness advance in this gate is the existence of the CPU worker identity. Tool execution and beta readiness stay closed.
