# WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-CONTAINER-SOURCE-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-owner-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-CONTAINER-SOURCE-OWNER-REVIEW",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_plan_completed_with_warnings_ready_for_container_source_owner_review_no_media_no_docker_build",
  "goal": "Review the planned FFmpeg, ffprobe, and libass source path/package surface before any Dockerfile edit.",
  "reviewSurface": {
    "futureSourcePath": "server/workers/sound-cpu/Dockerfile",
    "plannedPackages": ["ffmpeg", "libass9", "fontconfig", "fonts-dejavu-core"],
    "referencePolicies": [
      "docker/prod/ffmpeg-lgpl-build-policy.md",
      "docker/prod/core-tool-version-policy.md"
    ]
  },
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "ownerReview": true,
    "dockerfileEdit": false,
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

If this owner review passes, the next source gate may edit the Dockerfile. It still must not run Docker or media.
