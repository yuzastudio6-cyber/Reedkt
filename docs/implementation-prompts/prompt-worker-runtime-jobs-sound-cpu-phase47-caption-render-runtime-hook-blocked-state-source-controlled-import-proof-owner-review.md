# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE47-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-IMPORT-PROOF-OWNER-REVIEW

```json worker-runtime-jobs-sound-cpu-phase47-caption-render-runtime-hook-blocked-state-source-controlled-import-proof-owner-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase47_caption_render_runtime_hook_blocked_state_source_controlled_import_proof_passed_with_warnings_ready_for_import_proof_owner_review_no_media_no_artifacts",
  "goal": "Review the controlled static import/typecheck proof for the fail-closed OCR caption/render safe-zone hook, blocked-state integration, runtime integration, and SOUND CPU index exports before any later execution-planning gate.",
  "sourceHeadAtPromptCreation": "ce9f218e4a0710a5072a170a91a8dd0eb0e51647",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "proofEvidence": {
    "temporaryProofFileRemovedBeforeStaging": true,
    "temporaryProofFileSha256": "665f4231682163d439517948924ab770a288d5fbecbf379d66d7fe625ab66bbe",
    "expectedCommand": "npx tsc -b",
    "serverTypecheckCommand": "npm run typecheck:server",
    "importedSymbolCount": 18,
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

Use this prompt only after the Phase 47 proof packet merges and duplicate checks confirm no same-purpose owner-review PR already exists.
