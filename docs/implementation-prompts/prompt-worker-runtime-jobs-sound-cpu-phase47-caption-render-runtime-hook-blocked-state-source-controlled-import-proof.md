# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE47-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF

```json worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase46_caption_render_runtime_hook_blocked_state_source_static_validation_owner_review_passed_with_warnings_ready_for_controlled_import_proof_no_media_no_artifacts",
  "goal": "Run a controlled static import/typecheck proof for the fail-closed OCR caption/render safe-zone hook, blocked-state integration, runtime integration, and index exports without invoking factories, executing blocked assertions, reading media, writing artifacts, dispatching workers, calling routes/tools/providers, touching Supabase, or unlocking beta/production.",
  "hookSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "blockedStateIntegrationPath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "runtimeIntegrationPath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneRuntimeIntegration.ts",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "sourceHeadAtPromptCreation": "8d659c0e15a4b91ae69fc8e1a397e8755d81dee5",
  "proofRules": {
    "temporaryProofFile": "server/workers/sound-cpu/phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof.tmp.ts",
    "temporaryProofFileAllowed": true,
    "temporaryProofFileMustBeRemovedBeforeStaging": true,
    "expectedCommand": "npx tsc -b",
    "serverTypecheckCommand": "npm run typecheck:server",
    "importHookSymbols": true,
    "importBlockedStateIntegrationSymbols": true,
    "importRuntimeIntegrationSymbols": true,
    "importIndexSymbols": true,
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

Use this prompt only after the Phase 46 owner-review packet merges and duplicate checks confirm no same-purpose Phase 47 import-proof PR already exists.
