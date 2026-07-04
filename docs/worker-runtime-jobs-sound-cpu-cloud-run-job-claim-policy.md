# WORKER_RUNTIME_JOBS SOUND CPU Cloud Run Job Claim Policy

```json worker-runtime-jobs-sound-cpu-cloud-run-job-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-cloud-run-job-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_cloud_run_job_deployment_result_completed_with_blockers_ready_for_controlled_cloud_run_no_media_execution_proof",
  "allowedClaims": {
    "amd64DockerImageBuildPushPassed": true,
    "cloudRunJobsDeployed": true,
    "cloudRunJobsReady": true,
    "cloudRunJobsConfiguredWithDisabledRuntimeFlags": true,
    "allFifteenToolsImageInstalledInCloudRunDigest": true
  },
  "acceptedForToday": {
    "dockerBuildForAmd64Fix": "yes",
    "dockerPushForAmd64Fix": "yes",
    "cloudRunJobDeployment": "yes",
    "dockerRun": "no",
    "cloudRunJobExecution": "no",
    "workerExecution": "no",
    "routeExecution": "no",
    "agentCloudToolCall": "no",
    "mediaProcessing": "no",
    "supabaseMutation": "no",
    "sqlExecution": "no",
    "storageTransfer": "no",
    "signedUrlCreation": "no",
    "publicArtifactCreation": "no",
    "creditMutation": "no",
    "stripeProcessing": "no",
    "externalBetaUnlock": "no",
    "productionUnlock": "no"
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "noScopeStatement": "No Supabase mutation, SQL execution, Secret Manager value write, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Google Cloud action was limited to deploying the named SOUND CPU Cloud Run Jobs with disabled runtime flags; no Cloud Run Job execution, Docker run, or beta unlock was enabled."
}
```
