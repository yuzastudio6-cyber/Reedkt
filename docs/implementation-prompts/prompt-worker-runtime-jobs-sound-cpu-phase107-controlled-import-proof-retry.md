# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CONTROLLED-IMPORT-PROOF-RETRY

```json worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry
{
  "label": "worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-retry",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_retry_passed_with_warnings_ready_for_controlled_import_proof_owner_review_no_external_execution",
  "controlledProofScope": {
    "runProofRunnerOnce": true,
    "proofRunnerPath": "scripts/validation/worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-runner.mjs",
    "requiredExecutionPath": "tsx_controlled_import_inspection",
    "allowExternalAgentExecutionToday": false,
    "allowWorkerDispatchToday": false,
    "allowFactoryCallToday": false,
    "allowManifestPersistenceToday": false,
    "runSqlToday": false,
    "touchSupabaseEnvironmentToday": false,
    "createStorageObjectsToday": false,
    "persistManifestToday": false,
    "createSignedUrlToday": false,
    "openMediaFileToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Run the fixed proof runner exactly once. Stop on any runtime, worker, Supabase, media, storage/signing, or readiness widening signal.
