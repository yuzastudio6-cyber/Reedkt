# WORKER_RUNTIME_JOBS SOUND CPU Phase 107 Controlled Import Proof Sanitized Run Register

```json worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-sanitized-run-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase107-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-proof-sanitized-run-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase107_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_blocked_module_resolution_failure_no_external_execution",
  "sanitizedRun": {
    "proofRunnerExecutedOnce": true,
    "commandKind": "plain_node_mjs_runner",
    "targetSourceKind": "typescript_source",
    "targetSourceUsesExtensionlessInternalImport": true,
    "runnerOutputOk": false,
    "runnerBlockedReason": "controlled_import_proof_runner_failed",
    "runnerErrorSanitized": "Cannot find module '<repo>/server/workers/sound-cpu/runtime/privateManifestPersistence' imported from <repo>/server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts"
  },
  "observedSafetyFlags": {
    "moduleImported": false,
    "factoryCalled": false,
    "workerDispatched": false,
    "supabaseTouched": false,
    "mediaOpened": false,
    "sqlExecuted": false,
    "storageObjectCreated": false,
    "signedUrlCreated": false,
    "externalAgentExecutionReady": false,
    "realUserMediaBetaReady": false,
    "productionReady": false
  },
  "notRetriedInThisGate": true
}
```

The failed run is recorded without raw absolute local paths or stack traces.
