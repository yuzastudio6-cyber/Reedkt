# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37R-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF

```json worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37q_caption_render_runtime_hook_blocked_state_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_media_no_artifacts",
  "goal": "Run a controlled static import/typecheck proof for the fail-closed OCR caption/render safe-zone blocked-state source integration without invoking the factory or blocked assertion, executing the hook, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "sourceHeadAtPromptCreation": "f1fd561050c7735792e23cf64dc4e540a5139dc0",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "integrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "proofRules": {
    "temporaryProofFileAllowed": true,
    "temporaryProofFileMustBeRemovedBeforeStaging": true,
    "expectedCommand": "npx tsc -b",
    "serverTypecheckCommand": "npm run typecheck:server",
    "factoryInvocationAllowed": false,
    "blockedAssertionInvocationAllowed": false,
    "runtimeExecutionAllowed": false,
    "mediaInputAllowed": false,
    "artifactOutputAllowed": false
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

Use this prompt only after the Phase 37Q owner-review packet merges and duplicate checks confirm no same-purpose Phase 37R controlled-import-proof PR already exists.
