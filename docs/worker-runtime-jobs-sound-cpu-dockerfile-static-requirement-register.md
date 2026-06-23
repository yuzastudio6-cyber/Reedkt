# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Static Requirement Register

The requirement register identifies items a future static Dockerfile plan may describe. It does not approve creating a Dockerfile, building an image, pushing an image, or deploying anything.

```json worker-runtime-jobs-sound-cpu-dockerfile-static-requirement-register
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-STATIC-REVIEW",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_static_review_passed_with_warnings_ready_for_gate_1e_static_plan",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_contract_owner_review_passed_with_warnings_ready_for_dockerfile_static_plan",
  "acceptedForExecutionToday": "none",
  "requirementRows": [
    {"item": "base image selection", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may compare CPU-only base image options", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "SOUND-RUNTIME-MEDIA-GATE-1E", "blocker": "base image not selected or security-reviewed"},
    {"item": "Python runtime layer", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may pin Python runtime metadata", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "SOUND-RUNTIME-MEDIA-GATE-1E", "blocker": "runtime pin and image provenance not approved"},
    {"item": "requirements install layer", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may reference the controlled requirements file without installing here", "ownerBoundary": "WORKER_RUNTIME_JOBS/SOUND_MUSIC_AUDIO", "requiredNextGate": "SOUND-RUNTIME-MEDIA-GATE-1E", "blocker": "no Docker build or image proof approved"},
    {"item": "worker code layer", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may reserve a placeholder for worker code copy strategy", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future worker implementation approval", "blocker": "worker implementation code absent and not approved"},
    {"item": "validation/smoke layer", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may describe static checks only", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "future container validation owner review", "blocker": "no container smoke execution approved"},
    {"item": "runtime-disabled policy layer", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan must default to blocked execution flags", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "SOUND-RUNTIME-MEDIA-GATE-1E", "blocker": "runtime policy remains static-only"},
    {"item": "non-root user policy", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may require non-root container policy", "ownerBoundary": "COMPLIANCE_SECURITY/WORKER_RUNTIME_JOBS", "requiredNextGate": "future security owner review", "blocker": "no Dockerfile or user created"},
    {"item": "file permissions policy", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may define safe file ownership expectations", "ownerBoundary": "COMPLIANCE_SECURITY/WORKER_RUNTIME_JOBS", "requiredNextGate": "future security owner review", "blocker": "no file permissions changed"},
    {"item": "package cache policy", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may require no persistent package cache", "ownerBoundary": "WORKER_RUNTIME_JOBS", "requiredNextGate": "SOUND-RUNTIME-MEDIA-GATE-1E", "blocker": "no image layer created"},
    {"item": "pinned requirements path", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future plan may reuse the Gate 1A requirements file", "ownerBoundary": "SOUND_MUSIC_AUDIO/WORKER_RUNTIME_JOBS", "requiredNextGate": "SOUND-RUNTIME-MEDIA-GATE-1E", "blocker": "requirements not installed into an image"},
    {"item": "no FFmpeg/ffprobe", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must exclude FFmpeg and ffprobe from SOUND CPU images", "ownerBoundary": "TRACK_B_MEDIA_PROCESSING/WORKER_RUNTIME_JOBS", "requiredNextGate": "future media/system binary owner review", "blocker": "system binary handoff remains blocked"},
    {"item": "no model weights", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must not copy or download model weights", "ownerBoundary": "SOUND_MUSIC_AUDIO/COMPLIANCE_SECURITY", "requiredNextGate": "future model weight owner review", "blocker": "model provenance and storage blocked"},
    {"item": "no media fixtures", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must not include media fixtures", "ownerBoundary": "TRACK_B_MEDIA_PROCESSING/COMPLIANCE_SECURITY", "requiredNextGate": "future media policy owner review", "blocker": "real media access blocked"},
    {"item": "no secrets", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must not bake secrets into layers", "ownerBoundary": "COMPLIANCE_SECURITY", "requiredNextGate": "future secrets owner review", "blocker": "Secret Manager policy not approved"},
    {"item": "no service account files", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must not copy service account files", "ownerBoundary": "COMPLIANCE_SECURITY/GCP", "requiredNextGate": "future GCP owner review", "blocker": "service account policy not approved"},
    {"item": "no artifact write paths", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must keep artifact writes disabled", "ownerBoundary": "PUBLIC_ARTIFACT_DELIVERY_POLICY/SUPABASE_RLS_STORAGE_DATABASE", "requiredNextGate": "future artifact owner review", "blocker": "artifact policy not approved"},
    {"item": "no Supabase credentials", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must not include Supabase credentials", "ownerBoundary": "SUPABASE_RLS_STORAGE_DATABASE/COMPLIANCE_SECURITY", "requiredNextGate": "future Supabase owner review", "blocker": "Supabase mutation and SQL remain blocked"},
    {"item": "no provider credentials", "acceptedForStaticPlan": true, "acceptedForActualDockerfileToday": false, "acceptedForBuildToday": false, "reason": "future image plan must not include provider credentials", "ownerBoundary": "PROVIDER_GATEWAY_MODELS/COMPLIANCE_SECURITY", "requiredNextGate": "future provider owner review", "blocker": "provider calls and secrets remain blocked"}
  ],
  "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
