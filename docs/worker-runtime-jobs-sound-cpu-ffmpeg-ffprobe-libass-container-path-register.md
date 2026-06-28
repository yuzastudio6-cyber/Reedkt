# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Container Path Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-path-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_plan_completed_with_warnings_ready_for_container_source_owner_review_no_media_no_docker_build",
  "futureSourcePath": {
    "path": "server/workers/sound-cpu/Dockerfile",
    "existsToday": true,
    "editedToday": false,
    "currentPurpose": "SOUND CPU source-only Dockerfile with runtime disabled by default",
    "futureChangeType": "additive_system_package_declaration_after_owner_review"
  },
  "referencePolicySources": [
    "docker/prod/ffmpeg-lgpl-build-policy.md",
    "docker/prod/core-tool-version-policy.md",
    "docker/prod/cpu-worker/Dockerfile",
    "docker/prod/render-worker/Dockerfile"
  ],
  "sourceFilesNotEditedToday": [
    "server/workers/sound-cpu/Dockerfile",
    "docker/prod/cpu-worker/Dockerfile",
    "docker/prod/render-worker/Dockerfile",
    "docker/prod/ffmpeg-lgpl-build-policy.md"
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

The future source path is selected, but source creation/editing is intentionally deferred to the owner-reviewed lane.
