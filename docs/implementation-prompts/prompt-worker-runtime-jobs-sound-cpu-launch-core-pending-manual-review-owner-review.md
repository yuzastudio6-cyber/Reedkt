# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PENDING-MANUAL-REVIEW-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-owner-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PENDING-MANUAL-REVIEW-OWNER-REVIEW",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_closure_plan_completed_with_warnings_ready_for_pending_manual_review_owner_review_no_media_no_production",
  "goal": "Review whether manifest-backed launch-core tools may move from pending_manual_review to warning in static readiness, without runtime/media/beta/production unlock.",
  "reviewTargets": [
    "duckdb",
    "polars",
    "opentimelineio",
    "pyav",
    "pyscenedetect",
    "opencv",
    "sharp",
    "remotion"
  ],
  "allowedOwnerReviewScope": {
    "staticStatusTransitionToWarning": true,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "realUserMediaBetaUnlock": false,
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

Owner review may update static readiness status semantics only. It must not mark the tools passed or enable runtime execution.
