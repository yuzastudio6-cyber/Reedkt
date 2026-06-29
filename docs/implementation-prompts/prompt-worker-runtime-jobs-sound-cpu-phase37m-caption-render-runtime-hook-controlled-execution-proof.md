# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37M-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-EXECUTION-PROOF

```json worker-runtime-jobs-sound-cpu-phase37m-caption-render-runtime-hook-controlled-execution-proof
{
  "owner": "WORKER_RUNTIME_JOBS",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase37l_caption_render_runtime_hook_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts",
  "goal": "Run one bounded fail-closed hook proof using synthetic no-media input, then remove the temporary proof file before staging evidence.",
  "sourceHeadAtPromptCreation": "9f834444f124b2ccdedb7de059eee48da80efa35",
  "integrationTarget": "server/workers/sound-cpu/index.ts",
  "hookSourcePath": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
  "allowedProof": {
    "temporaryProofFile": "server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts",
    "allowedCommand": "npx tsx server/workers/sound-cpu/phase37m-caption-render-runtime-hook-controlled-execution-proof.tmp.ts",
    "requiredTypecheck": "npm run typecheck:server",
    "deleteTemporaryProofFileBeforeStaging": true,
    "hookFactoryInvocationAllowed": true,
    "blockedAssertionInvocationAllowed": true,
    "syntheticNoMediaInputOnly": true,
    "mediaReadAllowed": false,
    "artifactWriteAllowed": false,
    "workerDispatchAllowed": false,
    "routeToolProviderAllowed": false,
    "supabaseSqlAllowed": false
  },
  "blocked": [
    "real media input",
    "OCR inference over uploaded media",
    "caption/render runtime execution over media",
    "Remotion/render worker execution",
    "tool execution",
    "worker dispatch",
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

Use this prompt only after the Phase 37L owner-review packet merges and duplicate checks confirm no same-purpose Phase 37M proof PR already exists.
