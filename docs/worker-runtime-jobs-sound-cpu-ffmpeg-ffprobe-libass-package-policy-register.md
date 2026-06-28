# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Package Policy Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-package-policy-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_container_source_plan_completed_with_warnings_ready_for_container_source_owner_review_no_media_no_docker_build",
  "plannedSystemPackageSurface": {
    "ffmpegPackage": {
      "packageName": "ffmpeg",
      "provides": ["ffmpeg", "ffprobe"],
      "acceptedForFutureSourcePlanning": true,
      "acceptedForProductionReleaseToday": false
    },
    "libassPackage": {
      "packageName": "libass9",
      "provides": ["runtime subtitle rendering library"],
      "acceptedForFutureSourcePlanning": true,
      "acceptedForProductionReleaseToday": false
    },
    "fontSupportPackages": {
      "packageNames": ["fontconfig", "fonts-dejavu-core"],
      "reason": "Future static validation should verify subtitle/font availability without rendering media.",
      "acceptedForFutureSourcePlanning": true,
      "acceptedForProductionReleaseToday": false
    }
  },
  "policyWarnings": [
    "Distro ffmpeg declarations are development/readiness evidence only until commercial LGPL review passes.",
    "Local Homebrew ffmpeg includes GPL flags and is not accepted as production evidence.",
    "libass support must be verified separately by static command/filter validation before media use."
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

The planned package surface mirrors existing repo policy, but production release approval remains closed.
