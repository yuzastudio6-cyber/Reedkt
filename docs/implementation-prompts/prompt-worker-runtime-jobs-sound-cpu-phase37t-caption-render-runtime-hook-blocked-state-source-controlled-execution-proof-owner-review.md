# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37T-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PROOF-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37t_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts",
  "goal": "Review the Phase 37T synthetic fail-closed proof before any later integration readiness or execution planning. Do not run additional proofs, read media, write artifacts, dispatch workers, call routes/tools/providers, touch Supabase, or unlock beta/production.",
  "sourceHeadAtPromptCreation": "5b53c67f82994c019e53059799cd46bc6e2e2937",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "integrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "reviewFocus": {
    "sourceDecisionPresent": true,
    "factoryInvokedOnlyInControlledProof": true,
    "blockedAssertionInvokedOnlyInControlledProof": true,
    "syntheticNoMediaInputOnly": true,
    "temporaryProofFileRemoved": true,
    "allRuntimeApprovalsRemainFalse": true,
    "noArtifactCreated": true,
    "noWorkerDispatch": true,
    "noRouteToolProviderCalls": true,
    "noSupabaseSql": true,
    "noBetaProductionUnlock": true
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

Use this prompt only after the Phase 37T controlled proof packet merges and duplicate checks confirm no same-purpose owner-review PR already exists.
