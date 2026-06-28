# WORKER_RUNTIME_JOBS SOUND CPU Real User Media Beta Blocker Classification After Bounded External Beta

```json worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-classification-after-bounded-external-beta
{
  "label": "worker-runtime-jobs-sound-cpu-real-user-media-beta-blocker-classification-after-bounded-external-beta",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_real_user_media_beta_readiness_after_bounded_external_beta_completed_with_warnings_real_user_media_beta_still_blocked_ready_for_blocker_resolution_no_runtime_no_production",
  "sourcePr": 1422,
  "sourceMergeCommit": "a2a238cbdbf83b7c24377dfdc418b0262da46b60",
  "decision": "worker_runtime_jobs_sound_cpu_real_user_media_beta_blocker_resolution_after_bounded_external_beta_completed_with_warnings_ready_for_launch_core_real_check_plan_no_runtime_no_production",
  "blockerClassifications": [
    {
      "blockerId": "production_readiness_summary_blocked",
      "classification": "hard_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "launch_core_tool_readiness_and_model_license_deployment_security_storage_cost_approvals"
    },
    {
      "blockerId": "human_run_deployment_approval_required",
      "classification": "human_operational_approval_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "deployment_readiness_packet_after_tool_readiness"
    },
    {
      "blockerId": "security_approval_required",
      "classification": "human_security_approval_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "security_cost_storage_approval_packet_after_tool_readiness"
    },
    {
      "blockerId": "storage_privacy_approval_required",
      "classification": "storage_privacy_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "real_user_media_storage_privacy_boundary_packet"
    },
    {
      "blockerId": "model_weight_license_approval_required",
      "classification": "model_license_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "model_weight_license_review_packet"
    },
    {
      "blockerId": "launch_core_tool_readiness_missing",
      "classification": "tool_readiness_blocker",
      "closureStatus": "selected_next",
      "nextClosureDependency": "launch_core_real_check_plan"
    },
    {
      "blockerId": "provider_integration_not_done",
      "classification": "provider_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "provider_no_provider_beta_boundary_or_provider_gateway_approval"
    },
    {
      "blockerId": "final_export_missing",
      "classification": "scenario_export_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "export_readiness_after_worker_route_and_artifact_policies"
    },
    {
      "blockerId": "mask_confidence_low",
      "classification": "scenario_quality_blocker",
      "closureStatus": "not_closed",
      "nextClosureDependency": "mask_quality_review_or_scenario_exclusion_decision"
    }
  ],
  "classificationConclusion": {
    "totalBlockers": 9,
    "closedForExecutionToday": 0,
    "classifiedToday": 9,
    "selectedNextBlocker": "launch_core_tool_readiness_missing",
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  }
}
```

The blocker classification is explicit so the next closure can be focused instead of broad.
