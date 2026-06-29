# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37P-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-SOURCE-CREATION

```json worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-creation
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37o_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_integration_source_creation_no_media_no_artifacts",
  "goal": "Create the fail-closed blocked-state source integration surface for the OCR caption/render safe-zone hook without executing the hook, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "96782b19f331918f8751ad445f669620c83f9f44",
  "allowedScope": {
    "sourceCreationOnly": true,
    "createBlockedStateIntegrationSource": true,
    "staticExportsMayBeUpdatedIfRequired": true,
    "noHookExecution": true,
    "noMediaInput": true,
    "noArtifactOutput": true,
    "noWorkerDispatch": true,
    "noRouteToolProviderCalls": true,
    "noSupabaseSql": true,
    "noBetaUnlock": true,
    "noProductionUnlock": true
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

Use this prompt only after the Phase 37O owner-review packet merges and duplicate checks confirm no same-purpose Phase 37P source-creation PR already exists.
