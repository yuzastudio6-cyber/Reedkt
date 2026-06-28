# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Font Static Evidence Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-libass-font-static-evidence-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build",
  "staticEvidence": {
    "subtitleRenderRuntimeApprovedToday": false,
    "libassPackage": "libass9",
    "fontConfigPackage": "fontconfig",
    "fontPackage": "fonts-dejavu-core",
    "packagesDeclaredInDockerfile": true,
    "mediaFixtureValidationRun": false,
    "subtitleRenderValidationRun": false,
    "ffmpegFilterExecutionRun": false
  },
  "futureOwnerChecks": [
    "confirm LGPL package and dynamic-linking boundary",
    "confirm fonts are adequate for beta subtitle fixture coverage",
    "confirm no bundled font licensing issue",
    "confirm command availability in a later allowed build or run gate"
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

Font and libass coverage is static package-declaration evidence only.
