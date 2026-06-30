# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE40-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-INDEX-EXPORT-SOURCE-GATE

```json worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate
{
  "label": "worker-runtime-jobs-sound-cpu-phase40-caption-render-runtime-hook-blocked-state-index-export-source-gate",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase39_caption_render_runtime_hook_blocked_state_index_export_wiring_plan_completed_with_warnings_ready_for_index_export_source_gate_no_media_no_artifacts",
  "sourceHeadAtPromptCreation": "b42d66ab886ddf46bad0f8e7c96444df46b32e41",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceChangeScope": {
    "targetIndexPath": "server/workers/sound-cpu/index.ts",
    "runtimeIntegrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
    "addIndexExportBlock": true,
    "exportFailClosedSymbolsOnly": true,
    "preserveExistingExports": true,
    "dispatchWiringToday": false,
    "hookExecutionToday": false,
    "realMediaToday": false,
    "artifactCreationToday": false,
    "supabaseSqlToday": false,
    "betaUnlockToday": false,
    "productionUnlockToday": false
  },
  "expectedNextDecision": "worker_runtime_jobs_sound_cpu_phase40_caption_render_runtime_hook_blocked_state_index_export_source_gate_completed_with_warnings_ready_for_static_import_proof_no_media_no_artifacts",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Add only the planned fail-closed export block to `server/workers/sound-cpu/index.ts`. Do not wire dispatch, execute hooks, process media, create artifacts, call routes/tools/providers, touch Supabase, unlock beta, or unlock production.
