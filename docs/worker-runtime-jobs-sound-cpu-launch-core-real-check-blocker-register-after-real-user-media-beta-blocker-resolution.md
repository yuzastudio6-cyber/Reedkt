# WORKER_RUNTIME_JOBS SOUND CPU Launch Core Real Check Blocker Register After Real User Media Beta Blocker Resolution

```json worker-runtime-jobs-sound-cpu-launch-core-real-check-blocker-register-after-real-user-media-beta-blocker-resolution
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-real-check-blocker-register-after-real-user-media-beta-blocker-resolution",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_real_user_media_beta_blocker_resolution_after_bounded_external_beta_completed_with_warnings_ready_for_launch_core_real_check_plan_no_runtime_no_production",
  "sourcePr": 1425,
  "sourceMergeCommit": "b1fb65a130dbbf352a15a16b7bf1e775fb0a8e3a",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production",
  "remainingBlockers": [
    {
      "blockerId": "launch_core_real_checks_not_executed",
      "status": "selected_next",
      "blocksRealUserMediaBeta": true,
      "plannedClosure": "controlled_launch_core_real_check_proof"
    },
    {
      "blockerId": "ffmpeg_lgpl_manual_review_pending",
      "status": "manual_review_required",
      "blocksRealUserMediaBeta": true,
      "plannedClosure": "manual_lgpl_safe_build_review_after_check_proof"
    },
    {
      "blockerId": "libass_manual_verification_pending",
      "status": "manual_review_required",
      "blocksRealUserMediaBeta": true,
      "plannedClosure": "manual_subtitle_filter_and_font_packaging_review_after_check_proof"
    },
    {
      "blockerId": "optional_source_install_reviews_pending",
      "status": "deferred",
      "blocksRealUserMediaBeta": false,
      "plannedClosure": "source_install_review_if_optional_tools_are_required"
    },
    {
      "blockerId": "model_weight_license_approval_required",
      "status": "not_closed",
      "blocksRealUserMediaBeta": true,
      "plannedClosure": "separate_model_license_packet"
    },
    {
      "blockerId": "deployment_security_storage_cost_approvals_required",
      "status": "not_closed",
      "blocksRealUserMediaBeta": true,
      "plannedClosure": "separate_human_approval_packets_after_tool_readiness"
    }
  ],
  "blockerConclusion": {
    "launchCorePlanCreated": true,
    "launchCoreReadinessClosedToday": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "nextProofMayProceedOnlyIfDuplicateCheckPasses": true
  }
}
```

The launch-core plan narrows the first real-check blocker but does not close it.
