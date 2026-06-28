# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Static Validation Plan Result

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-plan-result
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "sourceBase": {
    "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "sourceHead": "b028b9c564ed982f59f9a8a45ead638f90bd068f",
    "sourceCreationPr": 1520,
    "sourceCreationMergeCommit": "b028b9c564ed982f59f9a8a45ead638f90bd068f",
    "sourceCreationDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build"
  },
  "planResult": {
    "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
    "staticValidationPlanCreated": true,
    "dockerfileTextInspectionPlanned": true,
    "commandAvailabilityValidationPlanned": true,
    "libassAndFontValidationPlanned": true,
    "licenseBoundaryValidationPlanned": true,
    "dockerBuildRunPushApprovedToday": false,
    "mediaExecutionApprovedToday": false,
    "runtimeExecutionApprovedToday": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION: run static Dockerfile/source validation, no media/no Docker build",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

This packet plans static validation only. It does not run Docker, FFmpeg, ffprobe, or media.
