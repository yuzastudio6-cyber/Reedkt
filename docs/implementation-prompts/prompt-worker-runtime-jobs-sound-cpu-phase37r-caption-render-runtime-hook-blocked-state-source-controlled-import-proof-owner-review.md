# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37R-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase37r-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37r_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_media_no_artifacts",
  "goal": "Review the controlled static import/typecheck proof for the fail-closed OCR caption/render safe-zone blocked-state source integration before any later execution-planning gate.",
  "sourceHeadAtPromptCreation": "bcab2737bdcf837f57e5b7fa1275446e8efc898b",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "integrationSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHookBlockedStateIntegration.ts",
  "proofEvidence": {
    "temporaryProofFileRemovedBeforeStaging": true,
    "expectedCommand": "npx tsc -b",
    "serverTypecheckCommand": "npm run typecheck:server",
    "importedSymbolCount": 7,
    "factoryInvocationAllowed": false,
    "blockedAssertionInvocationAllowed": false,
    "runtimeExecutionAllowed": false,
    "mediaInputAllowed": false,
    "artifactOutputAllowed": false
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

Use this prompt only after the Phase 37R proof packet merges and duplicate checks confirm no same-purpose owner-review PR already exists.
