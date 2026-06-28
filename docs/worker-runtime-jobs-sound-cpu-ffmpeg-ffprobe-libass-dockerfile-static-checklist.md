# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Dockerfile Static Checklist

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-static-checklist
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "requiredSourceAssertions": {
    "baseImage": "python:3.13-slim",
    "requirementsCopy": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "requiredPackages": ["ffmpeg", "fontconfig", "fonts-dejavu-core", "libass9", "libatomic1"],
    "disabledRuntimeFlags": [
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0",
      "REEDITPRO_WORKER_EXECUTION_ENABLED=0",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED=0"
    ],
    "nonRootUser": "reeditpro",
    "failClosedCommand": true
  },
  "forbiddenSourceAssertions": {
    "mediaFixturesCopied": false,
    "secretOrServiceAccountCopied": false,
    "supabaseCredentialCopied": false,
    "providerCredentialCopied": false,
    "workerRuntimeEntrypointEnabled": false
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

The checklist is text-only and should be validated without Docker.
