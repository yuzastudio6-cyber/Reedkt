# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE41-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-STATIC-IMPORT-PROOF

```json worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof
{
  "label": "worker-runtime-jobs-sound-cpu-phase41-caption-render-runtime-hook-blocked-state-static-import-proof",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts",
  "sourceHeadAtPromptCreation": "b223fce0e319ebdb8bcf8022dccc9c661f31129d",
  "owner": "WORKER_RUNTIME_JOBS",
  "proofScope": {
    "staticImportOnly": true,
    "importTarget": "server/workers/sound-cpu/index.ts",
    "importFailClosedSymbolsOnly": true,
    "invokeBlockedResultFactory": false,
    "invokeBlockedAssertion": false,
    "dispatchWiringToday": false,
    "hookExecutionToday": false,
    "realMediaToday": false,
    "artifactCreationToday": false,
    "supabaseSqlToday": false,
    "betaUnlockToday": false,
    "productionUnlockToday": false
  },
  "expectedNextDecision": "worker_runtime_jobs_sound_cpu_phase41_caption_render_runtime_hook_blocked_state_static_import_proof_passed_with_warnings_ready_for_static_import_proof_owner_review_no_media_no_artifacts",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Prove only that the fail-closed symbols can be statically imported from `server/workers/sound-cpu/index.ts`. Do not invoke blocked factories/assertions, wire dispatch, execute hooks, process media, create artifacts, call routes/tools/providers, touch Supabase, unlock beta, or unlock production.
