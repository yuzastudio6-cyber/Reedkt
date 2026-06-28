# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Source Creation Validation Report

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-source-creation-validation-report
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_created_with_warnings_ready_for_static_validation_plan_no_media_no_docker_build",
  "staticSourceChecks": {
    "dockerfileTextInspectionPassed": true,
    "approvedBaseImagePreserved": true,
    "approvedRequirementsCopyPreserved": true,
    "disabledRuntimeFlagsPreserved": true,
    "nonRootUserPreserved": true,
    "failClosedCommandPreserved": true,
    "forbiddenMediaFixturesAbsent": true,
    "forbiddenSecretsAbsent": true,
    "dockerBuildRunPushNotExecuted": true
  },
  "validationStillRequired": [
    "static_dockerfile_validation_plan",
    "static_command_availability_validation",
    "libass_filter_or_library_validation",
    "commercial_lgpl_review",
    "controlled_docker_build_proof_after_owner_review"
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

This validation report is source-text validation only.
