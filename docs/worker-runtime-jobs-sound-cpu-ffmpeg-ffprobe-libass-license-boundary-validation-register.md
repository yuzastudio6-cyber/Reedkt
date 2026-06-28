# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass License Boundary Validation Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-boundary-validation-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "policySources": [
    "docker/prod/ffmpeg-lgpl-build-policy.md",
    "docker/prod/core-tool-version-policy.md",
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-review-register.md"
  ],
  "licenseBoundary": {
    "distroPackageDeclarationsAllowedForReadinessSource": true,
    "commercialLgplReviewStillRequired": true,
    "codecPatentReviewStillRequired": true,
    "productionReleaseApprovedToday": false
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

Static validation cannot close commercial/legal production approval.
