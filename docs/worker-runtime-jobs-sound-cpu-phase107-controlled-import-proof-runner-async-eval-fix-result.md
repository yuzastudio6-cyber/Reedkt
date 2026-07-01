# WORKER_RUNTIME_JOBS SOUND CPU Phase 107 Controlled Import Proof Runner Async Eval Fix Result

```json worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-result
{
  "label": "worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-async-eval-fix-result",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_async_eval_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution",
  "sourceVerification": {
    "sourcePr": 2048,
    "sourceHead": "158fa692eccc4964be2acf2622aaeebb78a9a253",
    "sourceMergeCommit": "2ce0d5f3af2007d6ba7addaec4ef825244cfbb86",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution"
  },
  "fixResult": {
    "proofHarnessUpdated": true,
    "proofRunnerPath": "scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs",
    "previousEvalFailure": "top_level_await_not_supported_with_cjs_output_format",
    "fixedBy": "async_main_wrapper_inside_tsx_eval_payload",
    "staticScanBeforeImportPreserved": true,
    "tsxInvocationPreserved": true,
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

The async eval fix is still proof-harness-only. It does not rerun the controlled proof.
