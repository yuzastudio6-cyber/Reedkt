# WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-CONTAINER-SOURCE-CREATION

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-creation
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-CONTAINER-SOURCE-CREATION",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_owner_review_passed_with_warnings_ready_for_container_source_creation_no_media_no_docker_build",
  "goal": "Create the reviewed FFmpeg, ffprobe, and libass package declarations in the SOUND CPU Dockerfile source without building or running Docker.",
  "allowedFutureSourceEdit": {
    "path": "server/workers/sound-cpu/Dockerfile",
    "packages": ["ffmpeg", "libass9", "fontconfig", "fonts-dejavu-core"],
    "preserveDisabledRuntimeDefaults": true,
    "preserveNonRootUser": true,
    "preserveFailClosedCommand": true
  },
  "blockedScope": {
    "dockerBuildRunPush": false,
    "mediaProcessing": false,
    "ffmpegMediaExecution": false,
    "ffprobeMediaExecution": false,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "productionUnlock": false
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

This future gate may edit only the Dockerfile source declarations. It must not build an image, run Docker, or process media.
