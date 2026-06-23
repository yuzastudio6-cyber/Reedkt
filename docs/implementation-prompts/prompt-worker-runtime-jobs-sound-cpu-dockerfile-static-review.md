# WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW: review SOUND CPU Dockerfile static plan, no Docker build/GCP

```json worker-runtime-jobs-sound-cpu-dockerfile-static-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW",
  "title": "Review SOUND CPU Dockerfile static plan, no Docker build/GCP",
  "sourceMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTRACT-OWNER-REVIEW",
  "requiredDecision": "worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan",
  "staticContractMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-STATIC-CONTRACT-PLAN",
  "staticContractRequiredDecision": "worker_runtime_jobs_sound_cpu_static_contract_plan_completed_with_warnings_ready_for_contract_owner_review",
  "purpose": "Review future static Dockerfile/image planning for SOUND CPU workers without creating Dockerfiles, building images, running Docker, calling GCP, deploying Cloud Run, or executing workers.",
  "acceptedPlanningOnly": {
    "workerNames": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "imageNames": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ]
  },
  "requiredSourceEvidence": [
    "WORKER_RUNTIME_JOBS SOUND CPU contract owner review",
    "WORKER_RUNTIME_JOBS SOUND CPU static contract plan",
    "WORKER_RUNTIME_JOBS SOUND CPU handoff review",
    "SOUND-RUNTIME-MEDIA-GATE-1E Dockerfile static plan prompt"
  ],
  "blockedActions": [
    "worker implementation",
    "worker dispatch",
    "worker claim",
    "worker lease",
    "worker execution",
    "route execution",
    "tool execution",
    "Dockerfile creation",
    "Docker build",
    "Docker run",
    "Docker push",
    "Cloud Run execution",
    "GCP API call",
    "Secret Manager API call",
    "service account creation",
    "media file open",
    "media processing",
    "FFmpeg or ffprobe execution",
    "provider call",
    "model call",
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
