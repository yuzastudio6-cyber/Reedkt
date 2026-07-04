# WORKER_RUNTIME_JOBS SOUND CPU Docker Image Claim Policy

```json worker-runtime-jobs-sound-cpu-docker-image-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-docker-image-claim-policy",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan",
  "allowedClaims": {
    "dockerImageBuildPassed": true,
    "dockerImagePushPassed": true,
    "artifactRegistryTagsPresent": true,
    "allFifteenToolsImageInstalled": true
  },
  "acceptedForToday": {
    "dockerBuild": "yes",
    "dockerPush": "yes",
    "dockerRun": "no",
    "cloudRunDeployment": "no",
    "cloudRunExecution": "no",
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
  "noScopeStatement": "No Supabase mutation, SQL execution, Secret Manager value write, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. Docker action was limited to controlled local build and Artifact Registry push for the named SOUND CPU images; no Docker run was enabled."
}
```
