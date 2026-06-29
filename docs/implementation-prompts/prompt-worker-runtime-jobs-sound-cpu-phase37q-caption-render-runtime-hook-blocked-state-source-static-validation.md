# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Q-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_owner_review_passed_with_warnings_ready_for_static_validation_no_media_no_artifacts",
  "goal": "Statically validate the fail-closed Phase 37P blocked-state source integration surface for the OCR caption/render safe-zone hook without executing the hook, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "bdd36333a35f2c6640cb0515639b8a46e2319ff3",
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "staticValidationOnly": true,
    "inspectIntegrationSource": true,
    "inspectIndexExport": true,
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

Use this prompt only after the Phase 37P owner-review packet merges and duplicate checks confirm no same-purpose Phase 37Q static-validation PR already exists.
