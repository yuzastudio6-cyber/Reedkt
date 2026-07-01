# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE96-CAPTION-RENDER-RUNTIME-HOOK-ACTUAL-PRIVATE-MANIFEST-PERSISTENCE-SOURCE-CREATION

```json worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-actual-private-manifest-persistence-source-creation
{
  "label": "worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-actual-private-manifest-persistence-source-creation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_owner_review_passed_with_warnings_ready_for_actual_private_manifest_persistence_source_creation_no_execution",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_actual_private_manifest_persistence_source_created_with_warnings_ready_for_private_manifest_persistence_source_static_validation_no_execution",
  "allowedSourceCreationScope": {
    "createExactlyOneSourceFile": true,
    "allowedSourcePath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
    "modifyExistingPrivateManifestSource": false,
    "modifySupabaseGuardSource": false,
    "modifyJobContractSource": false,
    "createMigrationToday": false,
    "runSqlToday": false,
    "touchSupabaseEnvironmentToday": false,
    "createStorageBucketToday": false,
    "writeDatabaseRowsToday": false,
    "createStorageObjectsToday": false,
    "persistManifestToday": false,
    "createSignedUrlToday": false,
    "dispatchWorkerToday": false,
    "openMediaFileToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
  },
  "requiredRuntimeDefaults": {
    "workerExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactWritesEnabled": false,
    "signedUrlCreationEnabled": false,
    "supabaseWritesEnabled": false
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

Create only the approved private manifest persistence source file with fail-closed static types and no-execution helpers. Do not run SQL, touch Supabase, create storage, persist manifests, create signed URLs, dispatch workers, open media, or unlock beta or production.
