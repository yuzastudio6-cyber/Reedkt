# WORKER_RUNTIME_JOBS SOUND CPU Phase 107 Controlled Import Proof Runner TSX Invocation Fix Harness Register

```json worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-harness-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-harness-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution",
  "harnessUpdate": {
    "preservesAcceptedRunnerPath": true,
    "usesRepoTypescriptExecutionConvention": true,
    "typescriptExecutionPath": "tsx",
    "usesPlainNodeForTargetImport": false,
    "staticScanBeforeImport": true,
    "sanitizesChildProcessOutput": true,
    "requiresFailClosedGate": true
  },
  "blockedStill": {
    "externalAgentExecution": true,
    "workerDispatch": true,
    "factoryCalls": true,
    "manifestPersistence": true,
    "supabase": true,
    "sql": true,
    "storageOrSigning": true,
    "mediaOpen": true,
    "betaUnlock": true,
    "productionUnlock": true
  }
}
```

The next proof retry may run this runner once. This fix gate does not execute the proof.
