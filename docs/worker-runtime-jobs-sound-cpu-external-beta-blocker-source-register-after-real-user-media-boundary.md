# WORKER_RUNTIME_JOBS SOUND CPU External Beta Blocker Source Register After Real User Media Boundary

```json worker-runtime-jobs-sound-cpu-external-beta-blocker-source-register-after-real-user-media-boundary
{
  "label": "worker-runtime-jobs-sound-cpu-external-beta-blocker-source-register-after-real-user-media-boundary",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_external_beta_blocker_reconciliation_after_real_user_media_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_next_blocker_closure",
  "sources": [
    {
      "source": "PR #1390",
      "mergeCommit": "a51629662b5715489279595bfc0c7bb45d0434a1",
      "decision": "worker_runtime_jobs_sound_cpu_real_user_media_beta_boundary_closure_after_external_beta_reconciliation_completed_with_warnings_ready_for_external_beta_blocker_reconciliation_no_external_beta",
      "acceptedFor": "real_user_media_boundary_source"
    },
    {
      "source": "PR #1389",
      "mergeCommit": "096230d9fa0052cd1179639e092cb2024627e8ae",
      "decision": "worker_runtime_jobs_sound_cpu_external_beta_readiness_reconciliation_after_beta_support_boundary_completed_with_warnings_external_beta_still_blocked_ready_for_specific_blocker_closure",
      "acceptedFor": "external_beta_readiness_reconciliation_source"
    },
    {
      "source": "PR #1381",
      "mergeCommit": "734a4c10ec5b1a00fd51a59e6ad7e056ef5366fb",
      "decision": "worker_runtime_jobs_sound_cpu_beta_support_boundary_closure_after_worker_route_boundary_completed_with_warnings_ready_for_external_beta_readiness_reconciliation_no_external_beta",
      "acceptedFor": "beta_support_boundary_source"
    },
    {
      "source": "prod readiness summary",
      "overallStatus": "blocked",
      "hardBlockers": 101,
      "acceptedFor": "live_readiness_source"
    },
    {
      "source": "prod beta summary",
      "status": "internal_testing_ready",
      "externalBetaAllowed": false,
      "realUserMediaBetaAllowed": false,
      "acceptedFor": "live_beta_source"
    },
    {
      "source": "production tool profiles",
      "acceptedFor": "launch_core_tool_list_source"
    }
  ],
  "sourceConclusion": {
    "requiredPr1390Merged": true,
    "liveReadinessRerun": true,
    "liveBetaRerun": true,
    "crossChatOwnershipRerun": true,
    "externalBetaUnlockEvidencePresent": false
  }
}
```

The source register connects the latest merged lane evidence to the current live blocker list.
