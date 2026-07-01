# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE107-CONTROLLED-IMPORT-PROOF-RUNNER-TSX-INVOCATION-FIX

```json worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix
{
  "label": "worker-runtime-jobs-sound-cpu-phase107-controlled-import-proof-runner-tsx-invocation-fix",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase107_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_blocked_module_resolution_failure_no_external_execution",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase107_controlled_import_proof_runner_tsx_invocation_fix_completed_with_warnings_ready_for_controlled_import_proof_retry_no_external_execution",
  "fixScope": {
    "fixProofHarnessOnly": true,
    "recommendedExecutionPath": "tsx",
    "preserveStaticScanBeforeImport": true,
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

Fix the proof harness so the controlled import proof uses the repo TypeScript execution convention. Do not rerun the proof in the fix-source gate unless that prompt explicitly allows a new controlled proof attempt.
