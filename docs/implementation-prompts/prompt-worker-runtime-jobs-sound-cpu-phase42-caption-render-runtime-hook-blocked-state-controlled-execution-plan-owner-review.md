# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE42-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-CONTROLLED-EXECUTION-PLAN-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-plan-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase42_caption_render_runtime_hook_blocked_state_controlled_execution_plan_completed_with_warnings_ready_for_plan_owner_review_no_media_no_artifacts",
  "goal": "Review the Phase 42 controlled execution proof plan before allowing any later fail-closed runtime-integration factory/assertion proof.",
  "sourceHeadAtPromptCreation": "62756b0eed1b1297a009e5dbd05bdde5e5796601",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "runtimeIntegrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
  "reviewFocus": {
    "syntheticNoMediaInput": true,
    "noArtifactOutput": true,
    "noWorkerDispatch": true,
    "noRouteToolProviderCalls": true,
    "noSupabaseSql": true,
    "ownerReviewRequiredBeforeExecutionProof": true
  },
  "blocked": [
    "OCR caption/render runtime integration execution",
    "blocked-result factory invocation without owner-reviewed proof gate",
    "blocked assertion invocation without owner-reviewed proof gate",
    "Remotion/render worker execution",
    "media processing",
    "tool execution",
    "worker execution",
    "route execution",
    "provider/model calls",
    "GCP/Cloud Run/Secret Manager mutation",
    "Supabase/SQL",
    "artifact creation",
    "generated_local_fixture_passed claim",
    "dry_run_passed claim",
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

Use this prompt only after the Phase 42 plan merges and duplicate checks confirm no same-purpose owner-review PR already exists.
