# WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERIGNORE-SOURCE-PLAN: plan future .dockerignore source creation, no Docker build

```json worker-runtime-jobs-sound-cpu-dockerignore-source-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERIGNORE-SOURCE-PLAN",
  "title": "Plan future .dockerignore source creation, no Docker build",
  "sourceMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-PLAN",
  "requiredImageHardeningPlanDecision": "worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review",
  "purpose": "Plan future SOUND CPU .dockerignore source creation without Docker build, Docker push, Docker run, GCP, worker execution, media processing, Supabase, SQL, model weights, artifacts, beta, or production actions.",
  "targetDockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "plannedDockerignoreScope": [
    "node_modules",
    "dist",
    "dist-server",
    "env and secret files",
    "service account files",
    "temp logs",
    "media artifacts",
    "model weights",
    "Docker runtime artifacts"
  ],
  "actualDockerignoreCreatedByThisPrompt": "no",
  "acceptedForDockerBuildToday": "no",
  "acceptedForDockerPushToday": "no",
  "acceptedForDockerRunToday": "no",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. No Docker build, Docker push, or Docker run was enabled in this image-hardening planning prompt."
}
```
