# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE84-CAPTION-RENDER-RUNTIME-HOOK-PROOF-RUNNER-SOURCE-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-source-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_created_with_warnings_ready_for_source_static_validation_no_execution",
  "validationScope": {
    "runnerPath": "scripts/validation/worker-runtime-jobs-sound-cpu-phase83-controlled-fixture-instance-creation-proof-runner.mjs",
    "staticValidateImports": true,
    "staticValidateInputValidation": true,
    "staticValidateOutputManifestSchema": true,
    "staticValidateIdempotentWriteAndCleanup": true,
    "staticValidateNoExecutionGuards": true,
    "runProofRunnerToday": false,
    "createFixtureInstancesToday": false,
    "persistFixtureManifestToday": false,
    "openMediaFileToday": false,
    "createArtifactToday": false,
    "dispatchWorkerToday": false,
    "touchSupabaseSqlToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
  },
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase84_caption_render_runtime_hook_proof_runner_source_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_execution",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Statically validate the proof-runner source only. Do not run the proof, create fixture instances, persist manifests, open media, write artifacts, dispatch workers, call routes/tools/providers, touch Supabase, unlock beta, or unlock production.
