# SOUND-RUNTIME-MEDIA-GATE-1G: actual Dockerfile source creation, no Docker build/GCP

```json sound-runtime-media-gate-1g-actual-dockerfile-source-creation
{
  "prompt": "SOUND-RUNTIME-MEDIA-GATE-1G",
  "title": "Actual Dockerfile source creation, no Docker build/GCP",
  "sourceMilestone": "SOUND-RUNTIME-MEDIA-GATE-1F",
  "requiredSourceDecision": "sound_runtime_media_gate_1f_dockerfile_source_creation_plan_completed_with_warnings_ready_for_actual_dockerfile_source_gate",
  "expectedDecision": "sound_runtime_media_gate_1g_actual_dockerfile_source_creation_completed_with_warnings_ready_for_source_owner_review",
  "purpose": "Create the actual SOUND CPU Dockerfile source at the owner-reviewed path if Gate 1F evidence remains valid, without building images, pushing images, calling GCP, or executing workers.",
  "allowedFutureSourcePath": "server/workers/sound-cpu/Dockerfile",
  "requiredOwnerReviewBeforeMerge": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-SOURCE-OWNER-REVIEW",
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
    "FFmpeg or ffprobe",
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
