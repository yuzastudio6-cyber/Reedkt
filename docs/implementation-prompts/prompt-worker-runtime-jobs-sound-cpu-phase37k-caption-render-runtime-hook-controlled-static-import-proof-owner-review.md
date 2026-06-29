# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37K-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-STATIC-IMPORT-PROOF-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37k-caption-render-runtime-hook-controlled-static-import-proof-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37k_caption_render_runtime_hook_controlled_static_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_execution",
  "goal": "Review the controlled static import/typecheck proof for the fail-closed OCR caption/render hook exports before any later runtime execution planning.",
  "sourceHeadAtPromptCreation": "c61b0b13dfd012465e4c999bac1fca006ec1729d",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "hookSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "proofEvidence": {
    "temporaryProofFileRemovedBeforeStaging": true,
    "expectedCommand": "npx tsc -b",
    "serverTypecheckCommand": "npm run typecheck:server",
    "importedSymbolCount": 7,
    "hookFactoryInvocationAllowed": false,
    "blockedAssertionInvocationAllowed": false,
    "runtimeExecutionAllowed": false
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

Use this prompt only after the Phase 37K proof packet merges and duplicate checks confirm no same-purpose owner-review PR already exists.
