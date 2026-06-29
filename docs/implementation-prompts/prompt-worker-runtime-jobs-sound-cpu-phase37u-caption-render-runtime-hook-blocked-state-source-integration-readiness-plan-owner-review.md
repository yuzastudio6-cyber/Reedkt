# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37U-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-INTEGRATION-READINESS-PLAN-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37u-caption-render-runtime-hook-blocked-state-source-integration-readiness-plan-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37u_caption_render_runtime_hook_blocked_state_source_integration_readiness_plan_completed_with_warnings_ready_for_integration_readiness_owner_review_no_media_no_artifacts",
  "goal": "Review the Phase 37U blocked-state source integration-readiness plan before any later readiness closure or runtime planning. Do not execute hooks, read media, write artifacts, dispatch workers, call routes/tools/providers, touch Supabase, or unlock beta/production.",
  "sourceHeadAtPromptCreation": "4a48f23200595bb7dc05f83f638e086129a5caf8",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "integrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "reviewFocus": {
    "integrationReadinessMetadataOnly": true,
    "phase37TProofEvidenceConsumed": true,
    "temporaryProofFileAbsent": true,
    "blockedStateSourceStillFailClosed": true,
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

Use this prompt only after the Phase 37U packet merges and duplicate checks confirm no same-purpose owner-review PR already exists.
