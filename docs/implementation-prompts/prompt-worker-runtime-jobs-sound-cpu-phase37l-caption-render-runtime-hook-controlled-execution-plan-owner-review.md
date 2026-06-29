# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37L-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-EXECUTION-PLAN-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-plan-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37l_caption_render_runtime_hook_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_execution",
  "goal": "Review the Phase 37L controlled execution proof plan before allowing any later fail-closed hook factory/assertion proof.",
  "sourceHeadAtPromptCreation": "5dcb7d33c6d0bd2d273688efb3e5d2deacef35c2",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "hookSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "reviewFocus": {
    "syntheticNoMediaInput": true,
    "noArtifactOutput": true,
    "noWorkerDispatch": true,
    "noRouteToolProviderCalls": true,
    "noSupabaseSql": true,
    "ownerReviewRequiredBeforeExecutionProof": true
  },
  "blocked": [
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

Use this prompt only after the Phase 37L plan merges and duplicate checks confirm no same-purpose owner-review PR already exists.
