# WORKER_RUNTIME_JOBS SOUND CPU Build Context Dockerignore Plan

```json worker-runtime-jobs-sound-cpu-build-context-dockerignore-plan
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-PLAN",
  "decision": "worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review",
  "expectedBuildContext": "repository root for future Docker build proof",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "actualDockerignoreCreatedInThisGate": "no",
  "futureSourceGate": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERIGNORE-SOURCE-PLAN: plan future .dockerignore source creation, no Docker build",
  "proposedDockerignoreRequirements": [
    "exclude .git",
    "exclude node_modules",
    "exclude dist",
    "exclude dist-server",
    "exclude env files and secrets",
    "exclude service account files",
    "exclude temp logs",
    "exclude temp venvs",
    "exclude Docker runtime artifacts",
    "exclude generated media artifacts",
    "exclude model weights",
    "exclude Supabase local state and SQL outputs unless explicitly owner-approved",
    "include server/workers/sound-cpu/Dockerfile",
    "include server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"
  ],
  "blockedContextEntries": [
    "secrets",
    "service accounts",
    "node_modules",
    "dist",
    "dist-server",
    "media artifacts",
    "model weights",
    "temp logs",
    "Supabase credentials",
    "provider credentials",
    "SQL output artifacts"
  ],
  "runtimeFlags": {
    "dockerBuildRun": "no",
    "dockerPushRun": "no",
    "dockerRunRun": "no",
    "gcpTouched": "no",
    "artifactCreated": "no"
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
