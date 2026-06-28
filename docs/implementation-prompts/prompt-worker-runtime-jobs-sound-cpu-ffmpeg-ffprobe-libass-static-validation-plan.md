# WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-PLAN

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build",
  "requiredSourceCreationDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build",
  "goal": "Plan static validation for FFmpeg, ffprobe, and libass source declarations after owner review and source creation.",
  "blockedUntil": [
    "container_source_owner_review_passes",
    "actual_source_creation_gate_merges"
  ],
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "staticTextValidationPlan": true,
    "dockerBuildRunPush": false,
    "mediaProcessing": false,
    "ffmpegMediaExecution": false,
    "ffprobeMediaExecution": false,
    "runtimeExecution": false,
    "workerExecution": false,
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

This prompt is intentionally secondary; owner review and source creation must come first.
