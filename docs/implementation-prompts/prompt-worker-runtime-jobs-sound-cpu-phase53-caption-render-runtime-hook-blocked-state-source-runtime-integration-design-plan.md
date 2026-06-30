# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE53-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-DESIGN-PLAN

```json worker-runtime-jobs-sound-cpu-phase53-caption-render-runtime-hook-blocked-state-source-runtime-integration-design-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase52_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_owner_review_passed_with_warnings_ready_for_runtime_integration_design_plan_no_media_no_artifacts",
  "goal": "Plan a static runtime-integration design for the OCR caption/render safe-zone blocked-state source without changing source, wiring execution, opening media, writing artifacts, dispatching workers, executing routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "f95c7bd426c9d67d62c7613b676c5f2da0900e95",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "blockedStateIntegrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "runtimeIntegrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
  "allowedScope": {
    "docsDiagnosticsOnly": true,
    "planRuntimeIntegrationDesign": true,
    "staticBoundaryInspection": true,
    "noSourceCodeChange": true,
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

Use this prompt only after Phase 52 owner review merges and duplicate checks confirm no same-purpose Phase 53 PR already exists.
