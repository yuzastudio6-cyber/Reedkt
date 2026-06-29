# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37K-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-STATIC-IMPORT-PROOF

```json worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37j_caption_render_runtime_hook_static_integration_source_owner_review_passed_with_warnings_ready_for_controlled_static_import_proof_no_execution",
  "goal": "Run a controlled static import/typecheck proof for the fail-closed OCR caption/render hook exports without invoking hook functions or runtime paths.",
  "sourceHeadAtPromptCreation": "7809828ff16bb0f676c501a790a5b8e68aaabdae",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "hookSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "allowedProof": {
    "temporaryImportProofFile": true,
    "typecheckOnly": true,
    "expectedCommand": "npx tsc -b",
    "deleteTemporaryProofFileBeforeStaging": true,
    "runtimeExecutionAllowed": false,
    "hookFactoryInvocationAllowed": false,
    "blockedAssertionInvocationAllowed": false
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

Use this prompt only after the Phase 37J source owner review merges and duplicate checks confirm no same-purpose Phase 37K proof PR already exists.
