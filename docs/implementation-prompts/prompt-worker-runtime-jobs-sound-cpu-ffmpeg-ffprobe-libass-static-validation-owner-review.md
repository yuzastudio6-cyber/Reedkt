# WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-OWNER-REVIEW: review static validation evidence, no media/no Docker build

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION-OWNER-REVIEW",
  "title": "Review static validation evidence, no media/no Docker build",
  "sourceMilestone": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-STATIC-VALIDATION",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build",
  "purpose": "Owner-review FFmpeg, ffprobe, and libass static Dockerfile/source validation evidence without Docker build, Docker run, Docker push, FFmpeg command execution, ffprobe command execution, media processing, worker execution, Supabase, SQL, GCP, beta, or production unlock.",
  "requiredEvidenceDocs": [
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result.md",
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-dockerfile-instruction-validation-register.md",
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-prohibited-instruction-scan-register.md",
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-command-coverage-static-evidence-register.md",
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-libass-font-static-evidence-register.md",
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-blocker-follow-up-register.md",
    "docs/worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-result-claim-policy.md"
  ],
  "reviewSurface": {
    "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
    "packages": ["ffmpeg", "fontconfig", "fonts-dejavu-core", "libass9", "libatomic1"],
    "staticValidationAcceptedForReview": true
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

This owner-review prompt may review source text and documents only.
