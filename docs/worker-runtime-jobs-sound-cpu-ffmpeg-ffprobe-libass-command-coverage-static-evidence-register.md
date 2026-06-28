# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Command Coverage Static Evidence Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-command-coverage-static-evidence-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build",
  "staticEvidence": {
    "ffmpegPackageDeclared": true,
    "ffprobeCoveredByFfmpegPackage": true,
    "libassPackageDeclared": true,
    "fontconfigPackageDeclared": true,
    "fontsDejavuCorePackageDeclared": true,
    "libatomicRuntimeDependencyDeclared": true
  },
  "commandsNotRunInThisGate": [
    "docker build",
    "docker run",
    "docker push",
    "ffmpeg -version",
    "ffprobe -version",
    "ffmpeg -filters",
    "ffmpeg media command",
    "ffprobe media command"
  ],
  "acceptedForToday": {
    "staticSourceEvidenceOnly": true,
    "dockerBuild": false,
    "dockerRun": false,
    "dockerPush": false,
    "ffmpegCommandExecution": false,
    "ffprobeCommandExecution": false,
    "mediaProcessing": false,
    "runtimeReadiness": false
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

This evidence is declaration coverage only. Command availability remains future-gated.
