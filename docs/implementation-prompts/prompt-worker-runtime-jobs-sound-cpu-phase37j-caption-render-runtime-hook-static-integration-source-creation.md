# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37J-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-SOURCE-CREATION

```json worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-creation
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37i_caption_render_runtime_hook_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_creation_no_execution",
  "goal": "Create the static index export source for the fail-closed OCR caption/render hook without running the static import proof or any runtime path.",
  "sourceHeadAtPromptCreation": "d9facf0a2fad8493a19c42873da7d24c036107f9",
  "sourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "plannedIntegrationTarget": "server/workers/sound-cpu/index.ts",
  "allowedSourceChange": {
    "path": "server/workers/sound-cpu/index.ts",
    "purpose": "export blocked hook constants, factory, assertion, and types from the existing fail-closed hook source",
    "runtimeExecutionAllowed": false
  },
  "blocked": [
    "static import proof execution",
    "OCR runtime execution",
    "caption/render runtime execution",
    "Remotion/render worker execution",
    "media processing",
    "tool execution",
    "worker execution",
    "route execution",
    "provider/model calls",
    "GCP/Cloud Run/Secret Manager mutation",
    "Supabase/SQL",
    "artifact creation",
    "real-user media beta unlock",
    "paid production unlock"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Use this prompt only after the Phase 37I static-integration owner review merges and duplicate checks confirm no same-purpose Phase 37J PR already exists.
