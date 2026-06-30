# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE46-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase46-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_artifacts",
  "goal": "Review the Phase 46 static-validation evidence for the fail-closed OCR caption/render safe-zone hook, blocked-state integration, runtime integration, and index exports without executing hooks, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "684521a88ddd6e9ac9c991037227b3ad3366ebe6",
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "ownerReviewOnly": true,
    "reviewStaticValidationEvidence": true,
    "reviewHookSourceShape": true,
    "reviewBlockedStateIntegrationShape": true,
    "reviewRuntimeIntegrationShape": true,
    "reviewIndexExports": true,
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

Use this prompt only after the Phase 46 static-validation packet merges and duplicate checks confirm no same-purpose owner-review PR already exists.
