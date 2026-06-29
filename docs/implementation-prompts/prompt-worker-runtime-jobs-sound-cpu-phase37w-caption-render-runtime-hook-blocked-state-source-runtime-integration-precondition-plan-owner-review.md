# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37W-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-RUNTIME-INTEGRATION-PRECONDITION-PLAN-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37w-caption-render-runtime-hook-blocked-state-source-runtime-integration-precondition-plan-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37w_caption_render_runtime_hook_blocked_state_source_runtime_integration_precondition_plan_completed_with_warnings_ready_for_precondition_owner_review_no_media_no_artifacts",
  "goal": "Review Phase 37W runtime-integration preconditions for the OCR caption/render safe-zone blocked-state source without enabling hook execution, media reads, artifact writes, worker dispatch, routes/tools/providers, Supabase, beta, or production.",
  "sourceHeadAtPromptCreation": "97fd1e925dcee8f2d19827fd5bb24c66bfa37245",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "integrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "reviewFocus": {
    "phase37VOwnerReviewConsumed": true,
    "preconditionCountAccepted": 8,
    "allExecutionPreconditionsSatisfiedToday": false,
    "blockedStateSourceStillFailClosed": true,
    "temporaryProofFileAbsent": true,
    "runtimeIntegrationAllowedToday": false,
    "realMediaAllowed": false,
    "artifactCreationAllowed": false,
    "workerDispatchAllowed": false,
    "routeToolProviderAllowed": false,
    "supabaseSqlAllowed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
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

Use this prompt only after the Phase 37W precondition plan merges and duplicate checks confirm no same-purpose owner-review PR already exists.
