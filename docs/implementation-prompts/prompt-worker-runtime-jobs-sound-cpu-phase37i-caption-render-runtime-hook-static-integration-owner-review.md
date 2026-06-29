# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37I-CAPTION-RENDER-RUNTIME-HOOK-STATIC-INTEGRATION-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37i-caption-render-runtime-hook-static-integration-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37i_caption_render_runtime_hook_static_integration_plan_completed_with_warnings_ready_for_static_integration_owner_review_no_execution",
  "goal": "Review the Phase 37I static-integration plan for the fail-closed OCR caption/render hook before any index export source change or static import proof source gate.",
  "sourceHeadAtPromptCreation": "2bdea9a34cc553baa6a7f3911883d6a522c69f5c",
  "sourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "plannedIntegrationTarget": "server/workers/sound-cpu/index.ts",
  "blocked": [
    "index export source change",
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

Use this prompt only after the Phase 37I static-integration plan merges and duplicate checks confirm no same-purpose owner-review PR already exists.
