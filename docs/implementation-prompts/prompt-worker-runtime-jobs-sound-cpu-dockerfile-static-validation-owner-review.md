# WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-VALIDATION-OWNER-REVIEW: review static Dockerfile validation, no Docker build/GCP

```json worker-runtime-jobs-sound-cpu-dockerfile-static-validation-owner-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-VALIDATION-OWNER-REVIEW",
  "title": "Review static Dockerfile validation, no Docker build/GCP",
  "sourceMilestone": "SOUND-RUNTIME-MEDIA-GATE-1H",
  "requiredSourceOwnerReviewMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-SOURCE-OWNER-REVIEW",
  "requiredSourceOwnerReviewDecision": "worker_runtime_jobs_sound_cpu_dockerfile_source_owner_review_passed_with_warnings_ready_for_static_validation",
  "requiredStaticValidationMilestone": "SOUND-RUNTIME-MEDIA-GATE-1H",
  "requiredStaticValidationDecision": "sound_runtime_media_gate_1h_dockerfile_static_validation_passed_with_warnings_ready_for_docker_build_proof_planning",
  "requiredDockerfileSourcePath": "server/workers/sound-cpu/Dockerfile",
  "purpose": "Review future static Dockerfile validation evidence without building, pushing, deploying, or executing workers.",
  "blockedActions": [
    "Docker build",
    "Docker push",
    "Docker run",
    "GCP API call",
    "Cloud Run execution",
    "Secret Manager API call",
    "service account creation",
    "worker execution",
    "route execution",
    "tool execution",
    "media processing",
    "FFmpeg or ffprobe execution",
    "model download",
    "artifact write",
    "Supabase mutation",
    "SQL execution",
    "billing or Stripe mutation",
    "beta or production unlock"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled."
}
```
