# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE98-CAPTION-RENDER-RUNTIME-HOOK-PRIVATE-MANIFEST-PERSISTENCE-STATIC-INTEGRATION-SOURCE-GATE

```json worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate
{
  "label": "worker-runtime-jobs-sound-cpu-phase98-caption-render-runtime-hook-private-manifest-persistence-static-integration-source-gate",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_gate_no_execution",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase98_caption_render_runtime_hook_private_manifest_persistence_static_integration_source_gate_completed_with_warnings_ready_for_static_integration_source_owner_review_no_execution",
  "sourceGateScope": {
    "staticSourceIntegrationGateOnly": true,
    "targetPath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
    "allowFailClosedStaticSourceChange": true,
    "allowWorkerDispatchToday": false,
    "runSqlToday": false,
    "touchSupabaseEnvironmentToday": false,
    "createStorageObjectsToday": false,
    "persistManifestToday": false,
    "createSignedUrlToday": false,
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

Create or plan only the fail-closed static source integration surface approved by Phase 97. Do not persist manifests, run SQL, touch Supabase, create storage objects, create signed URLs, dispatch workers, open media, or unlock beta or production.
