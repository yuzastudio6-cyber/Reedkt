# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Static Validation Result

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build",
  "sourceBase": {
    "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "sourceHead": "e405f08d1e974e355cf3de54f9af1f3027c5534f",
    "staticValidationPlanPr": 1523,
    "staticValidationPlanMergeCommit": "e405f08d1e974e355cf3de54f9af1f3027c5534f",
    "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
    "sourceCreationPr": 1520,
    "sourceCreationMergeCommit": "b028b9c564ed982f59f9a8a45ead638f90bd068f"
  },
  "validationResult": {
    "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
    "staticValidationPassed": true,
    "dockerfileTextInspectionPassed": true,
    "requiredPackagesPresent": ["ffmpeg", "fontconfig", "fonts-dejavu-core", "libass9", "libatomic1"],
    "disabledRuntimeFlagsPresent": true,
    "nonRootUserPresent": true,
    "failClosedCommandPresent": true,
    "forbiddenCopyPatternsFound": false,
    "dockerBuildRunPushApprovedToday": false,
    "ffmpegCommandExecutionApprovedToday": false,
    "ffprobeCommandExecutionApprovedToday": false,
    "mediaExecutionApprovedToday": false,
    "runtimeExecutionApprovedToday": false,
    "launchCoreReadinessPassed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-OWNER-REVIEW: review static validation evidence, no media/no Docker build",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

This validation reads source text only. It does not run Docker, FFmpeg, ffprobe, or media.
