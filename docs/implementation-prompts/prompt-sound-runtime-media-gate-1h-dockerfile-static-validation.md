# SOUND-RUNTIME-MEDIA-GATE-1H: Dockerfile static validation, no Docker build

```json sound-runtime-media-gate-1h-dockerfile-static-validation
{
  "prompt": "SOUND-RUNTIME-MEDIA-GATE-1H",
  "title": "Dockerfile static validation, no Docker build",
  "sourceMilestone": "SOUND-RUNTIME-MEDIA-GATE-1G",
  "requiredSourceDecision": "sound_runtime_media_gate_1g_actual_dockerfile_source_created_with_warnings_ready_for_dockerfile_source_owner_review",
  "requiredDockerfileSourcePath": "server/workers/sound-cpu/Dockerfile",
  "purpose": "Run static source validation for the SOUND CPU Dockerfile without building an image, pushing an image, calling GCP, or executing workers.",
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
