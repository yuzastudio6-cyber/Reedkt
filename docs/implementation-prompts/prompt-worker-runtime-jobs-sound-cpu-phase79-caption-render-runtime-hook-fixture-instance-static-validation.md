# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE79-CAPTION-RENDER-RUNTIME-HOOK-FIXTURE-INSTANCE-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase79-caption-render-runtime-hook-fixture-instance-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase78_caption_render_runtime_hook_limited_fixture_instance_planning_owner_review_passed_with_warnings_ready_for_instance_static_validation_no_execution",
  "validationScope": {
    "validateFixtureInstanceIds": true,
    "validateSourceFixtureReferences": true,
    "validatePrivateMediaAssetMappings": true,
    "validatePlannedPrivateArtifactMappings": true,
    "validateNoPathsUrlsOrProviderBlobs": true,
    "validateRuntimeFlagsRemainFalse": true,
    "createFixtureInstancesToday": false,
    "useRealMediaBytesToday": false,
    "openMediaFileToday": false,
    "createArtifactToday": false,
    "persistFixtureManifestToday": false,
    "dispatchWorkerToday": false,
    "touchSupabaseSqlToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
  },
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase79_caption_render_runtime_hook_fixture_instance_static_validation_passed_with_warnings_ready_for_instance_static_validation_owner_review_no_execution",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Run static validation only. Do not create fixture instances, open media, write artifacts, persist manifests, dispatch workers, call routes/tools/providers, touch Supabase, unlock beta, or unlock production.
