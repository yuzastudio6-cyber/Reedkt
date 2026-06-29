# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37Q-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-STATIC-VALIDATION-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37q-caption-render-runtime-hook-blocked-state-source-static-validation-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37q_caption_render_runtime_hook_blocked_state_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_artifacts",
  "goal": "Review the Phase 37Q static-validation evidence for the fail-closed OCR caption/render safe-zone blocked-state source integration without executing the hook, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "d8296d481d699d965231f439444346cf990dff39",
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "ownerReviewOnly": true,
    "reviewStaticValidationEvidence": true,
    "reviewIntegrationSourceShape": true,
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

Use this prompt only after the Phase 37Q static-validation packet merges and duplicate checks confirm no same-purpose owner-review PR already exists.
