# WORKER_RUNTIME_JOBS SOUND CPU GCP IAM Claim Policy

```json worker-runtime-jobs-sound-cpu-gcp-iam-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-iam-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_gcp_iam_role_binding_result_completed_with_blockers_ready_for_docker_image_build_push_plan",
  "allowedClaims": {
    "serviceAccountExists": true,
    "minimalProjectIamRolesBound": true,
    "loggingWriterBound": true,
    "monitoringMetricWriterBound": true,
    "readyForDockerImageBuildPushPlanning": true
  },
  "forbiddenClaims": [
    "SOUND CPU tools are deployed in Google Cloud",
    "Cloud Run jobs were deployed",
    "Cloud Run jobs executed",
    "Docker images were built",
    "Docker images were pushed",
    "Docker images were run",
    "external beta ready",
    "production ready",
    "worker ready",
    "runtime ready",
    "media ready"
  ],
  "acceptedForToday": {
    "serviceAccountCreation": "previous_gate",
    "loggingWriterIamBinding": "yes",
    "monitoringMetricWriterIamBinding": "yes",
    "storageIamBinding": "no",
    "secretManagerIamBinding": "no",
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

This policy permits only the IAM-readiness claim needed to move to image build/push. It does not claim that the 15 tools are cloud-executable yet.
