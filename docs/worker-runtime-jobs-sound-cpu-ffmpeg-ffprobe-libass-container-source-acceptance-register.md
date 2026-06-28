# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Container Source Acceptance Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-acceptance-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_owner_review_passed_with_warnings_ready_for_container_source_creation_no_media_no_docker_build",
  "acceptedForFutureSourceCreation": {
    "futureSourcePath": "server/workers/sound-cpu/Dockerfile",
    "plannedSystemPackages": ["ffmpeg", "libass9", "fontconfig", "fonts-dejavu-core"],
    "ffmpegProvidesFfprobe": true,
    "referencePolicies": [
      "docker/prod/ffmpeg-lgpl-build-policy.md",
      "docker/prod/core-tool-version-policy.md"
    ],
    "sourceCreationMayEditDockerfileInFutureGate": true
  },
  "notAcceptedToday": {
    "actualDockerfileEditedToday": false,
    "dockerBuildRunPush": false,
    "mediaProcessing": false,
    "ffmpegMediaExecution": false,
    "ffprobeMediaExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "productionRelease": false
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

The accepted surface is source-planning scope only.
