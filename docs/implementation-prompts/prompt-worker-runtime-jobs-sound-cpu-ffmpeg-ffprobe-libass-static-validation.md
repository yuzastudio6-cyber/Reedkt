# WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "goal": "Run static Dockerfile/source validation for FFmpeg, ffprobe, and libass declarations without Docker build or media execution.",
  "allowedStaticChecks": {
    "readDockerfileText": true,
    "verifyPackageDeclarations": ["ffmpeg", "fontconfig", "fonts-dejavu-core", "libass9", "libatomic1"],
    "verifyDisabledRuntimeFlags": true,
    "verifyNonRootUser": true,
    "verifyFailClosedCommand": true,
    "verifyNoMediaSecretsArtifacts": true
  },
  "blockedScope": {
    "dockerBuildRunPush": false,
    "ffmpegCommandExecution": false,
    "ffprobeCommandExecution": false,
    "mediaProcessing": false,
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

This future gate may read source text only. It must not run Docker, FFmpeg, ffprobe, or media.
