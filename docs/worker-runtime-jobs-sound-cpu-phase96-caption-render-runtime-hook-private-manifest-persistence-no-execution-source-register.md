# WORKER_RUNTIME_JOBS SOUND CPU Phase 96 Private Manifest Persistence No-Execution Source Register

```json worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-no-execution-source-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-no-execution-source-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_actual_private_manifest_persistence_source_created_with_warnings_ready_for_private_manifest_persistence_source_static_validation_no_execution",
  "failClosedBehavior": {
    "blockedResultFactoryCreated": true,
    "blockedResultFactoryName": "createSoundCpuPrivateManifestPersistenceBlockedResult",
    "mutationAssertionCreated": true,
    "mutationAssertionName": "assertSoundCpuPrivateManifestPersistenceMutationBlocked",
    "referencesSupabaseGuardStateOnly": true,
    "throwsThroughExistingSupabaseGuardOnMutationAttempt": true
  },
  "acceptedForToday": {
    "staticTypes": true,
    "blockedResultFactory": true,
    "supabaseGuardStateReference": true,
    "supabaseMutation": false,
    "sqlExecution": false,
    "storageObjectCreation": false,
    "manifestPersistence": false,
    "signedUrlCreation": false,
    "workerDispatch": false,
    "mediaFileOpen": false,
    "routeExecution": false,
    "providerCall": false,
    "modelCall": false,
    "betaUnlock": false,
    "productionUnlock": false
  }
}
```

The source is allowed to return a blocked metadata result. It is not allowed to persist, dispatch, open media, call providers, call models, or unlock beta or production.
