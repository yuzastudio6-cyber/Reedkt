# WORKER_RUNTIME_JOBS SOUND CPU Phase 106 Controlled Import Static Scan Plan

```json worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-static-scan-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase106-caption-render-runtime-hook-private-manifest-persistence-runtime-execution-contract-controlled-import-static-scan-plan",
  "decision": "worker_runtime_jobs_sound_cpu_phase106_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_controlled_import_proof_runner_source_plan_completed_with_warnings_ready_for_controlled_import_proof_runner_source_gate_no_execution",
  "staticScanPlan": {
    "scanBeforeDynamicImport": true,
    "scanTargetSource": "server/workers/sound-cpu/runtime/privateManifestPersistenceExecutionContract.ts",
    "scanProofRunnerSourceBeforeCommit": true,
    "forbiddenPatterns": [
      "createClient(",
      ".insert(",
      ".upsert(",
      "storage.from",
      "createSignedUrl",
      "fs.readFile",
      "fetch(",
      "dispatch",
      "executeRoute"
    ],
    "requiredTargetSnippets": [
      "acceptedForExternalAgentExecutionToday: false",
      "acceptedForRuntimeExecutionToday: false",
      "acceptedForWorkerDispatchToday: false"
    ]
  },
  "today": {
    "proofRunnerSourceCreated": false,
    "staticScanImplemented": false,
    "dynamicImportRan": false
  }
}
```

The static scan is planned here so the later source gate can create it without broadening runtime scope.
