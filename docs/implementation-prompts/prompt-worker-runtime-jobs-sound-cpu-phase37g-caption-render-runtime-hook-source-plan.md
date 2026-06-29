# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37G-CAPTION-RENDER-RUNTIME-HOOK-SOURCE-PLAN

```json worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-source-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37f_caption_render_runtime_hook_owner_review_passed_with_warnings_ready_for_runtime_hook_source_plan_no_execution",
  "goal": "Plan the future source shape for the OCR caption/render safe-zone hook without implementing source, executing OCR, rendering captions, processing media, dispatching workers, calling routes/tools/providers, creating artifacts, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "b92abb58629a9368953b238f6230d454a0dbacec",
  "acceptedHook": {
    "hookName": "ocrCaptionRenderSafeZonePlanningHook",
    "acceptedMode": "future_source_planning_only",
    "sourceEvidence": "Phase 37F owner-review packet"
  },
  "allowed": [
    "docs/diagnostics-only source plan",
    "static file-path and interface planning",
    "owner handoff mapping",
    "blocked-scope and validation prompt selection"
  ],
  "blocked": [
    "runtime hook source implementation",
    "OCR runtime execution",
    "OCR inference",
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

Use this prompt only after the Phase 37F owner-review packet merges and duplicate checks confirm no source-plan PR already exists.
