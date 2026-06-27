# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Runtime Dependency Source Fix Dockerfile Register

```json worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-source-fix-dockerfile-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_source_fix_passed_with_warnings_ready_for_source_fix_owner_review",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "expectedInstructions": {
    "from": "FROM --platform=linux/amd64 python:3.13-slim",
    "aptPackage": "libatomic1",
    "requirementsCopy": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "runtimeDisabledEnv": [
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0",
      "REEDITPRO_WORKER_EXECUTION_ENABLED=0",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED=0"
    ],
    "user": "reeditpro",
    "cmd": "fail_closed_disabled_runtime_message"
  },
  "prohibitedInstructions": [
    "ffmpeg",
    "ffprobe",
    "docker push",
    "gcloud",
    "cloud run",
    "supabase",
    "service-account",
    "secret"
  ],
  "dockerWarningAccepted": {
    "id": "FromPlatformFlagConstDisallowed",
    "whyAccepted": "The current gate intentionally pins linux/amd64 because audioflux 0.1.9 bundled shared libraries are x86_64; owner review must decide whether to keep this lane."
  }
}
```
