# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Pending Manual Review Acceptance Register

```json worker-runtime-jobs-sound-cpu-launch-core-pending-manual-review-acceptance-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_pending_manual_review_owner_review_passed_with_warnings_static_status_transition_to_warning_no_media_no_production",
  "acceptedTools": [
    {
      "toolId": "duckdb",
      "evidenceLane": "shared_python_manifest",
      "acceptedStaticStatus": "warning"
    },
    {
      "toolId": "polars",
      "evidenceLane": "shared_python_manifest",
      "acceptedStaticStatus": "warning"
    },
    {
      "toolId": "opentimelineio",
      "evidenceLane": "shared_python_manifest",
      "acceptedStaticStatus": "warning"
    },
    {
      "toolId": "pyav",
      "evidenceLane": "isolated_pyav_manifest",
      "acceptedStaticStatus": "warning"
    },
    {
      "toolId": "pyscenedetect",
      "evidenceLane": "isolated_opencv_scenedetect_manifest",
      "acceptedStaticStatus": "warning"
    },
    {
      "toolId": "opencv",
      "evidenceLane": "isolated_opencv_scenedetect_manifest",
      "acceptedStaticStatus": "warning"
    },
    {
      "toolId": "sharp",
      "evidenceLane": "node_package_manifest",
      "acceptedStaticStatus": "warning"
    },
    {
      "toolId": "remotion",
      "evidenceLane": "node_package_manifest",
      "acceptedStaticStatus": "warning"
    }
  ],
  "acceptedForExecutionToday": false,
  "acceptedForProductionToday": false,
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Each accepted tool has manifest, controlled install/import proof, source-install review, and owner review evidence. The accepted status remains `warning`, not `passed`.
