# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass License Review Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-license-review-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_plan_completed_with_warnings_ready_for_container_source_owner_review_no_media_no_docker_build",
  "licenseReviewState": {
    "ffmpegCommercialLgplReviewRequired": true,
    "ffprobeCommercialLgplReviewRequired": true,
    "libassReviewRequired": true,
    "currentRepoPolicy": "docker/prod/ffmpeg-lgpl-build-policy.md",
    "productionReleaseApprovedToday": false
  },
  "futureOwnerQuestions": [
    "Are distro ffmpeg and ffprobe acceptable for readiness images only?",
    "Which exact configure flags must be recorded for production release?",
    "Can libass runtime packages be included in the SOUND CPU source image for static validation?",
    "Which font packages are acceptable for future subtitle/render validation without broad media execution?"
  ],
  "blockedUntilReview": [
    "commercial_ffmpeg_distribution_claim",
    "real_user_media_processing",
    "caption_burn_in_readiness",
    "paid_production_readiness"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The policy source already allows dev/readiness declarations, but not final commercial release claims.
