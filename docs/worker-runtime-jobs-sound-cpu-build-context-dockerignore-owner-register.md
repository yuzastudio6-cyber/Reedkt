# WORKER_RUNTIME_JOBS SOUND CPU Build Context Dockerignore Owner Register

```json worker-runtime-jobs-sound-cpu-build-context-dockerignore-owner-register
{
  "milestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-HARDENING-OWNER-REVIEW",
  "decision": "worker_runtime_jobs_sound_cpu_image_hardening_owner_review_passed_with_warnings_ready_for_dockerignore_source_plan",
  "sourcePlanDecision": "worker_runtime_jobs_sound_cpu_image_hardening_plan_completed_with_warnings_ready_for_image_hardening_owner_review",
  "dockerignoreSourcePlanningMayProceed": "yes",
  "actualDockerignoreCreatedToday": "no",
  "futureDockerignoreScopeAccepted": [
    "exclude .git",
    "exclude node_modules",
    "exclude dist",
    "exclude dist-server",
    "exclude env and secret files",
    "exclude service account files",
    "exclude temp logs",
    "exclude temp venvs",
    "exclude Docker runtime artifacts",
    "exclude generated media artifacts",
    "exclude model weights",
    "exclude Supabase local state and SQL outputs unless explicitly owner-approved"
  ],
  "requiredIncludedPaths": [
    "server/workers/sound-cpu/Dockerfile",
    "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"
  ],
  "dockerBuildRun": "no",
  "dockerPushRun": "no",
  "dockerRunRun": "no",
  "artifactCreated": "no",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
