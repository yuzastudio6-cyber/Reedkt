# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Command Static Validation Plan

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-command-static-validation-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "commandCoveragePlan": {
    "ffmpeg": {
      "sourcePackage": "ffmpeg",
      "futureStaticAssertion": "Dockerfile declares ffmpeg package",
      "futureCommandProofRequiresLaterGate": true
    },
    "ffprobe": {
      "sourcePackage": "ffmpeg",
      "futureStaticAssertion": "ffprobe is covered by distro ffmpeg package",
      "futureCommandProofRequiresLaterGate": true
    },
    "libass": {
      "sourcePackage": "libass9",
      "futureStaticAssertion": "Dockerfile declares libass runtime package",
      "futureCommandProofRequiresLaterGate": true
    }
  },
  "notRunInThisGate": [
    "ffmpeg -version",
    "ffprobe -version",
    "ffmpeg -filters",
    "docker build",
    "docker run"
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

Command execution remains future-gated.
