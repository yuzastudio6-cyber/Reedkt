# WORKER_RUNTIME_JOBS SOUND CPU Internal Beta State Register After Runner Boundary Execution Proof

```json worker-runtime-jobs-sound-cpu-internal-beta-state-register-after-runner-boundary-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-internal-beta-state-register-after-runner-boundary-execution-proof",
  "decision": "worker_runtime_jobs_sound_cpu_internal_beta_state_change_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_unlock_owner_confirmation",
  "soundCpuInternalBetaState": {
    "previousState": "ready_for_bounded_internal_beta_state_change",
    "newState": "bounded_internal_testing_enabled_metadata_only",
    "stateChangedInThisPacket": true,
    "stateChangedAtSourceCommit": "56e7fd1afb25cd86bac19d8ddce11e7cb2003cf5",
    "stateChangeScope": "SOUND_CPU_15_ACCEPTED_TOOLS_SYNTHETIC_NO_MEDIA_NO_ARTIFACT_NO_SUPABASE_NO_WORKER_ROUTE_EXECUTION",
    "requiresOwnerConfirmationNext": true
  },
  "acceptedTools": {
    "toolCount": 15,
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2,
    "runtimeExecutionApproved": false,
    "productToolCallExecutionApproved": false
  },
  "productStateClosures": {
    "productWideInternalBetaUnlocked": false,
    "externalBetaUnlocked": false,
    "realUserMediaBetaUnlocked": false,
    "paidProductionUnlocked": false,
    "productionUnlocked": false
  }
}
```

The state is intentionally lane-scoped. Product-wide beta state remains unchanged.
