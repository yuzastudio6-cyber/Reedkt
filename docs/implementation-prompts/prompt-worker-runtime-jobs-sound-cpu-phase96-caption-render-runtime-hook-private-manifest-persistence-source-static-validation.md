# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE96-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-SOURCE-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_actual_private_manifest_persistence_source_created_with_warnings_ready_for_private_manifest_persistence_source_static_validation_no_execution",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_passed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution",
  "staticValidationScope": {
    "validateSourcePath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
    "validateFailClosedBlockedResult": true,
    "validateRuntimeDefaultsFalse": true,
    "validateRejectedInputFields": true,
    "validateSupabaseGuardOnly": true,
    "runSqlToday": false,
    "touchSupabaseEnvironmentToday": false,
    "createStorageObjectsToday": false,
    "persistManifestToday": false,
    "createSignedUrlToday": false,
    "dispatchWorkerToday": false,
    "openMediaFileToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
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

Statically validate the private manifest persistence source. Do not persist manifests, run SQL, touch Supabase, create storage objects, create signed URLs, dispatch workers, open media, or unlock beta or production.
