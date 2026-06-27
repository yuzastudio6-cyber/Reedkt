# WORKER_RUNTIME_JOBS SOUND CPU Current Lane Context Register

```json worker-runtime-jobs-sound-cpu-current-lane-context-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_current_lane_status_review_completed_with_warnings_ready_for_runtime_beta_readiness_decision_review",
  "contextRows": [
    {
      "lane": "package_proof",
      "currentDecision": "worker_runtime_jobs_sound_cpu_package_proof_owner_review_passed_with_warnings_ready_for_lane_reconciliation",
      "currentMergeCommit": "5a8082efbd81313687d0d16470ae6058f2a53889",
      "status": "accepted_for_planning_only"
    },
    {
      "lane": "package_proof_lane_reconciliation",
      "currentDecision": "worker_runtime_jobs_sound_cpu_package_proof_lane_reconciliation_completed_with_warnings_ready_for_current_lane_status_review",
      "currentMergeCommit": "792b67da0a2fa29ddd147fb0ef18732e11793b29",
      "status": "current_status_review_ready"
    },
    {
      "lane": "synthetic_tool_call_owner_review",
      "currentDecision": "worker_runtime_jobs_sound_cpu_synthetic_tool_call_owner_review_passed_with_warnings_ready_for_synthetic_worker_route_plan",
      "currentMergeCommit": "5aefb6c0ff60c6206c9aa8b1e99834ba08486186",
      "status": "older_planning_context_do_not_recreate"
    },
    {
      "lane": "controlled_runtime_beta_preflight",
      "currentDecision": "worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_passed_with_warnings_ready_for_runtime_execution_approval_gate",
      "currentMergeCommit": "65123c44225e6460fad1f044f202bc5785e605db",
      "status": "older_static_preflight_context_do_not_recreate"
    },
    {
      "lane": "runtime_execution_approval_gate",
      "currentDecision": "worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_passed_with_warnings_ready_for_limited_no_media_no_artifact_execution_plan",
      "currentMergeCommit": "a2d7d543ab427d0ab77ebad6d8be1450aea91e01",
      "status": "older_execution_criteria_context_do_not_recreate"
    },
    {
      "lane": "limited_no_media_no_artifact_package_proof",
      "currentDecision": "worker_runtime_jobs_sound_cpu_music21_import_timeout_fix_passed_with_warnings_ready_for_package_proof_owner_review",
      "currentMergeCommit": "cbe4c9e415a29725ebe5a574c1e41e2288d668b3",
      "status": "current_package_proof_resolved"
    }
  ]
}
```
