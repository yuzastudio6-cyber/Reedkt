# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Pending Manual Review Target Register

```json worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-target-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_closure_plan_completed_with_warnings_ready_for_pending_manual_review_owner_review_no_media_no_production",
  "targetTools": [
    {
      "toolId": "duckdb",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "shared_python_manifest"
    },
    {
      "toolId": "polars",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "shared_python_manifest"
    },
    {
      "toolId": "opentimelineio",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "shared_python_manifest"
    },
    {
      "toolId": "pyav",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "isolated_pyav_manifest"
    },
    {
      "toolId": "pyscenedetect",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "isolated_opencv_scenedetect_manifest"
    },
    {
      "toolId": "opencv",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "isolated_opencv_scenedetect_manifest"
    },
    {
      "toolId": "sharp",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "node_package_manifest"
    },
    {
      "toolId": "remotion",
      "currentStatus": "pending_manual_review",
      "futureOwnerReviewTargetStatus": "warning",
      "evidenceLane": "node_package_manifest"
    }
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

The target status is `warning` because these tools have source/install/import evidence but still lack production runtime execution checks.
