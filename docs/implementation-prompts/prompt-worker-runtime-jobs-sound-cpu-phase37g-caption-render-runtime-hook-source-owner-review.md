# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37G-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37g_caption_render_runtime_hook_source_plan_completed_with_warnings_ready_for_source_owner_review_no_execution",
  "goal": "Review the Phase 37G source plan for future actual hook source creation without creating source, executing OCR, rendering captions, processing media, dispatching workers, calling routes/tools/providers, creating artifacts, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "c0ec29cc7eeaebbddac415d1f7ab3d1c6d2a3281",
  "plannedFuturePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "allowed": [
    "docs/diagnostics-only source owner review",
    "acceptance or narrowing of planned future source path",
    "blocked-scope and next-prompt selection"
  ],
  "blocked": [
    "source file creation",
    "runtime hook implementation",
    "OCR runtime execution",
    "caption/render runtime execution",
    "Remotion/render worker execution",
    "media processing",
    "frame extraction",
    "tool execution",
    "worker execution",
    "route execution",
    "provider/model calls",
    "Docker build/run/push",
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

Use this only after the Phase 37G source-plan packet merges and duplicate checks confirm no source-owner-review PR already exists.
