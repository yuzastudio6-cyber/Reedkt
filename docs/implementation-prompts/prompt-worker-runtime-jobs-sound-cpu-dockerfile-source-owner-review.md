# WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-SOURCE-OWNER-REVIEW: review future SOUND CPU Dockerfile source plan, no Docker build/GCP

```json worker-runtime-jobs-sound-cpu-dockerfile-source-owner-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-SOURCE-OWNER-REVIEW",
  "title": "Review future SOUND CPU Dockerfile source plan, no Docker build/GCP",
  "sourceMilestone": "SOUND-RUNTIME-MEDIA-GATE-1F",
  "requiredPriorMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-OWNER-REVIEW",
  "requiredPriorDecision": "worker_runtime_jobs_sound_cpu_dockerfile_static_owner_review_passed_with_warnings_ready_for_gate_1f_source_creation_plan",
  "purpose": "Review a future actual Dockerfile source creation plan without building images, pushing images, calling GCP, deploying Cloud Run, or executing workers.",
  "acceptedPlanningOnly": {
    "workers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "images": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"
  },
  "blockedActions": [
    "Docker build",
    "Docker push",
    "GCP API call",
    "Cloud Run execution",
    "Secret Manager API call",
    "service account creation",
    "worker execution",
    "route execution",
    "tool execution",
    "media processing",
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
