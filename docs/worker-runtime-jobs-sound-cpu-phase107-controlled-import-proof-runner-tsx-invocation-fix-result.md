# WORKER_RUNTIME_JOBS SOUND CPU Phase 107 Controlled Import Proof Runner TSX Invocation Fix Result

```json worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-result
{
  "label": "worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix-result",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution",
  "sourceVerification": {
    "sourcePr": 2046,
    "sourceHead": "3d6810782c9f7fd0f15c93788c900771b5055f25",
    "sourceMergeCommit": "9bcc736384290081b4b1bf071b2e64c91b263163",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_phase107_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_blocked_module_resolution_failure_no_external_execution"
  },
  "fixResult": {
    "proofHarnessUpdated": true,
    "proofRunnerPath": "scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs",
    "previousInvocationPath": "plain_node_dynamic_import",
    "fixedInvocationPath": "tsx_controlled_import_inspection",
    "staticScanBeforeImportPreserved": true,
    "proofRunnerExecutedInThisFixGate": false,
    "controlledImportProofPassedClaimed": false,
    "readyForRetry": true
  },
  "soundCpuTools": {
    "covered": 15,
    "readyForRealExecutionToday": 0
  },
  "selectedNextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CONTROLLED-IMPORT-PROOF-RETRY",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The fix changes only the proof harness invocation path. It does not run the proof or enable external-agent execution.
