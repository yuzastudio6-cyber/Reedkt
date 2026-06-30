# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE56-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-RUNTIME-SOURCE-MODIFICATION-GATE

```json worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate
{
  "label": "worker-runtime-jobs-sound-cpu-phase56-caption-render-runtime-hook-blocked-state-source-runtime-integration-runtime-source-modification-gate",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase55_caption_render_runtime_hook_blocked_state_source_runtime_integration_source_creation_plan_owner_review_passed_with_warnings_ready_for_runtime_source_modification_gate_no_media_no_artifacts",
  "sourceHeadAtPromptCreation": "1bfa6ea2b32636d030a2075b93b14aaf6e2824cf",
  "existingRuntimeIntegrationSource": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
  "existingBlockedStateSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "existingIntegrationTarget": "server/workers/sound-cpu/index.ts",
  "allowedScope": {
    "modifyExistingRuntimeIntegrationSourceFailClosed": true,
    "createNewRuntimeSourceToday": false,
    "wireIndexToday": false,
    "wireDispatchToday": false,
    "executeHookToday": false,
    "useRealMediaToday": false,
    "createArtifactToday": false,
    "dispatchWorkerToday": false,
    "callRouteToolProviderToday": false,
    "touchSupabaseSqlToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
  },
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase56_caption_render_runtime_hook_blocked_state_source_runtime_integration_runtime_source_modification_gate_completed_with_warnings_ready_for_runtime_source_modification_owner_review_no_media_no_artifacts",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Modify only the existing runtime integration source, and keep it fail-closed. Do not create new runtime source, wire dispatch, execute the hook, process media, create artifacts, call routes/tools/providers, touch Supabase, unlock beta, or unlock production.
