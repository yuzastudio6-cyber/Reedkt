# WORKER_RUNTIME_JOBS SOUND CPU Internal Beta State Readiness Register After Runner Boundary Execution Proof

```json worker-runtime-jobs-sound-cpu-internal-beta-state-readiness-register-after-runner-boundary-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-internal-beta-state-readiness-register-after-runner-boundary-execution-proof",
  "decision": "worker_runtime_jobs_sound_cpu_internal_beta_state_change_after_runner_boundary_execution_proof_completed_with_warnings_ready_for_internal_beta_unlock_owner_confirmation",
  "readinessRerun": {
    "prodReadinessSummaryCommand": "npm run prod:readiness:summary",
    "prodBetaSummaryCommand": "npm run prod:beta:summary",
    "prodReadinessOverallStatus": "blocked",
    "prodReadinessMode": "static_only",
    "prodReadinessHardBlockers": 101,
    "prodReadinessWarnings": 26,
    "prodBetaStatus": "internal_testing_ready",
    "internalDryRunAllowed": true,
    "externalBetaAllowed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
  },
  "stateChangeReadinessDecision": {
    "boundedSoundCpuInternalBetaMetadataStateChangeAllowed": true,
    "productWideInternalBetaUnlockAllowed": false,
    "externalBetaUnlockAllowed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionAllowed": false,
    "stopRatherThanForceReadiness": true,
    "mustConfirmOwnerAfterStateChange": true
  }
}
```

The fresh summaries allow bounded internal testing metadata to proceed, but they still block product-wide, external beta, real user media beta, paid production, and production readiness.
