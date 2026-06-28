# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PENDING-MANUAL-REVIEW-CLOSURE-PLAN

```json worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-closure-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PENDING-MANUAL-REVIEW-CLOSURE-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_native_runtime_isolated_proof_owner_review_passed_with_warnings_source_install_review_closed_ready_for_pending_manual_review_closure_plan_no_media_no_production",
  "goal": "Plan the next smallest safe closure for launch-core tools now that source-install review is closed and static readiness records pending_manual_review.",
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
  "allowedPlanningScope": {
    "pendingManualReviewClosurePlan": true,
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

This prompt should not execute tools or media. It should decide the exact non-runtime evidence needed to move launch-core tools beyond pending manual review.
