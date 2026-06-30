# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE46-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase45_caption_render_runtime_hook_blocked_state_source_integration_plan_owner_review_passed_with_warnings_ready_for_blocked_state_source_static_validation_no_media_no_artifacts",
  "goal": "Statically validate the existing fail-closed OCR caption/render safe-zone hook, blocked-state integration source, runtime integration source, and index exports without creating source, modifying source, executing hooks, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "0e0d996bb8e1fbc9693494c7d440515ad0ec1915",
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "staticValidationOnly": true,
    "inspectExistingHookSource": true,
    "inspectExistingBlockedStateIntegrationSource": true,
    "inspectExistingRuntimeIntegrationSource": true,
    "inspectIndexExports": true,
    "noSourceCreation": true,
    "noSourceModification": true,
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

Use this prompt only after the Phase 45 owner-review packet merges and duplicate checks confirm no same-purpose Phase 46 static-validation PR already exists.
