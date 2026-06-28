# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Source-Install Remaining Blocker Register

```json worker-runtime-jobs-sound-cpu-launch-core-source-install-remaining-blocker-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_source_install_review_after_readiness_reconciliation_passed_with_warnings_ready_for_native_runtime_source_install_review_no_runtime_no_production",
  "sourceInstallReviewStillRequired": [
    {
      "toolId": "pyav",
      "reason": "FFmpeg linkage and bundled native video libraries require separate native/runtime review."
    },
    {
      "toolId": "pyscenedetect",
      "reason": "Transitive OpenCV and media-bound scene detection need native/runtime review before execution."
    },
    {
      "toolId": "opencv",
      "reason": "Native OpenCV package and media/frame operation surface require security/runtime review."
    },
    {
      "toolId": "sharp",
      "reason": "libvips/LGPL dependency and image-processing runtime surface require separate review."
    },
    {
      "toolId": "remotion",
      "reason": "Browser/render runtime and Remotion licensing/runtime dependency surface require separate review."
    }
  ],
  "separateMissingLaunchCoreTargets": [
    "ffmpeg",
    "ffprobe",
    "hyperframe",
    "libass"
  ],
  "modelWeightAndEvaluationTargetsRemainBlocked": true,
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The remaining source-install items are intentionally not closed in this gate.
