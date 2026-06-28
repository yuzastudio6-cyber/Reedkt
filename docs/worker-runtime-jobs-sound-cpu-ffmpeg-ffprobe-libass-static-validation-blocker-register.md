# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Static Validation Blocker Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-blocker-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "blockersNotClosed": [
    "ffmpeg_launch_core_readiness",
    "ffprobe_launch_core_readiness",
    "libass_launch_core_readiness",
    "ffmpeg_command_proof",
    "ffprobe_command_proof",
    "libass_static_or_filter_proof",
    "commercial_lgpl_review",
    "media_runtime_owner_gate",
    "real_user_media_beta_gate",
    "paid_production_gate"
  ],
  "unblockedNextGate": "static_validation_no_media_no_docker_build",
  "requiredNextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION: run static Dockerfile/source validation, no media/no Docker build",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The next gate may validate source text, but launch-core readiness remains closed until proof gates satisfy readiness policy.
