# WORKER_RUNTIME_JOBS SOUND CPU Phase 107 Controlled Import Proof Runner TSX Invocation Fix Claim Policy

```json worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-claim-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution",
  "claimPolicy": {
    "proofHarnessFixedClaimed": true,
    "controlledImportProofPassedClaimed": false,
    "moduleImportedClaimed": false,
    "runtimeImportReadyClaimed": false,
    "externalAgentExecutionReadyClaimed": false,
    "workerReadinessClaimed": false,
    "runtimeReadinessClaimed": false,
    "manifestPersistenceReadyClaimed": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false,
    "realUserMediaBetaReadyClaimed": false,
    "productionReadinessClaimed": false
  },
  "allowedClaim": "proof_harness_invocation_path_fixed_for_retry",
  "nextGateMayRunProofRunnerOnce": true,
  "nextGateMayRunExternalAgent": false
}
```

The fix claims only harness readiness for a retry, not runtime readiness.
