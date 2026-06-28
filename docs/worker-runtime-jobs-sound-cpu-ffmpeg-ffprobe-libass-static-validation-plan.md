# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Static Validation Plan

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_plan_completed_with_warnings_ready_for_container_source_owner_review_no_media_no_docker_build",
  "futureStaticValidationAfterSource": {
    "dockerfileTextInspection": true,
    "requiresFfmpegPackageDeclaration": true,
    "requiresFfprobeAvailabilityViaFfmpegPackage": true,
    "requiresLibassRuntimeDeclaration": true,
    "requiresFontconfigAndFontPackageDeclaration": true,
    "requiresRuntimeDisabledDefaultsPreserved": true,
    "requiresNoMediaFixtures": true,
    "requiresNoWorkerExecutionEntrypoint": true
  },
  "commandsStillBlockedInThisPlan": [
    "docker build",
    "docker run",
    "docker push",
    "ffmpeg media processing",
    "ffprobe media inspection",
    "Cloud Run or GCP invocation"
  ],
  "futureValidationPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-PLAN: plan static validation after container source owner review, no media/no Docker build",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Static validation is a later gate and must inspect source text only until a separate controlled build proof is approved.
