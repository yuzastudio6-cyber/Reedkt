# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Container Source Requirements

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-container-source-requirements
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_policy_closure_plan_completed_with_warnings_ready_for_container_source_plan_no_media_no_production",
  "requiredFutureEvidence": {
    "containerSourceDeclared": true,
    "ffmpegBinaryPathDeclared": true,
    "ffprobeBinaryPathDeclared": true,
    "libassOrSubtitleFilterPolicyDeclared": true,
    "licenseCompatibilityReviewed": true,
    "commercialUsePolicyReviewed": true,
    "noMediaExecutionDuringPlan": true,
    "noDockerBuildDuringPlan": true
  },
  "containerSourcePlanMustNot": [
    "run media through ffmpeg",
    "run media through ffprobe",
    "build or push Docker images",
    "call GCP or Cloud Run",
    "claim real-user media beta",
    "claim paid production",
    "create public or signed artifacts"
  ],
  "futureReadyOnlyAfter": [
    "source declaration",
    "owner review",
    "static validation",
    "controlled build proof",
    "no-media command proof",
    "separate media policy gate"
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

This register defines evidence requirements only. It does not create Dockerfiles, install packages, or execute media commands.
