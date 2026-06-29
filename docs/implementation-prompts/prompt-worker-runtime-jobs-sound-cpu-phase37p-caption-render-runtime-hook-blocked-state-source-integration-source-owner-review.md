# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37P-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-SOURCE-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37p-caption-render-runtime-hook-blocked-state-source-integration-source-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37p_caption_render_runtime_hook_blocked_state_source_integration_source_created_with_warnings_ready_for_source_owner_review_no_media_no_artifacts",
  "goal": "Review the fail-closed Phase 37P blocked-state source integration surface for the OCR caption/render safe-zone hook without executing the hook, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "a2ebc7ae9160e319c6196631690351b36e532374",
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "ownerReviewOnly": true,
    "reviewBlockedStateIntegrationSource": true,
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

Use this prompt only after Phase 37P merges and duplicate checks confirm no same-purpose source owner-review PR already exists.
