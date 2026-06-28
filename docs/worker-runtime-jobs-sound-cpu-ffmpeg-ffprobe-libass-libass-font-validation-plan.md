# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Font Validation Plan

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-libass-font-validation-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "futureValidationTargets": {
    "libassPackageDeclared": "libass9",
    "fontconfigPackageDeclared": "fontconfig",
    "baselineFontPackageDeclared": "fonts-dejavu-core",
    "subtitleFilterOrLibraryValidationRequiresLaterGate": true,
    "mediaRenderValidationRequiresLaterGate": true
  },
  "blockedToday": {
    "subtitleRender": false,
    "mediaFileOpen": false,
    "ffmpegFilterExecution": false,
    "browserCapture": false,
    "artifactCreation": false
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

This is a plan for static declarations, not a subtitle rendering proof.
