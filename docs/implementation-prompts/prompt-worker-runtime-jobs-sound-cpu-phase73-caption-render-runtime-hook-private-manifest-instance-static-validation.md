# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE73-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-INSTANCE-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase73-caption-render-runtime-hook-private-manifest-instance-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_private_manifest_instance_static_validation_no_media_no_artifacts",
  "validationScope": {
    "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "proofRunner": "scripts/validation/worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation-runner.ts",
    "staticValidateControlledInstanceEvidence": true,
    "staticValidateRunnerUsesValidator": true,
    "staticValidateRuntimeFlagsRemainFalse": true,
    "staticValidateNoMediaNoArtifactClaims": true,
    "runRealMediaToday": false,
    "createArtifactToday": false,
    "dispatchWorkerToday": false,
    "touchSupabaseSqlToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
  },
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase73_caption_render_runtime_hook_private_manifest_instance_static_validation_passed_with_warnings_ready_for_private_manifest_instance_static_validation_owner_review_no_media_no_artifacts",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Statically validate the controlled private manifest instance evidence and proof runner only. Do not use real media, write artifacts, dispatch workers, call routes/tools/providers, touch Supabase, unlock beta, or unlock production.
