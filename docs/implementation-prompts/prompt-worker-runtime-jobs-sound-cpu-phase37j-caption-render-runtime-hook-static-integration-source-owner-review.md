# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37J-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-SOURCE-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37j-caption-render-runtime-hook-static-integration-source-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_created_with_warnings_ready_for_source_owner_review_no_execution",
  "goal": "Review the Phase 37J static index export source before any controlled static import proof is created or run.",
  "sourceHeadAtPromptCreation": "347c0546e53b070a89f233bf5fafc7c21b2c9eeb",
  "sourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "blocked": [
    "controlled static import proof execution",
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

Use this prompt only after the Phase 37J static-integration source PR merges and duplicate checks confirm no same-purpose source-owner-review PR already exists.
