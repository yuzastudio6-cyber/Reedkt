# WORKER_RUNTIME_JOBS SOUND CPU Phase 97 Private Manifest Persistence Static Integration Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase97-caption-render-runtime-hook-private-manifest-persistence-static-integration-owner-claim-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase97_caption_render_runtime_hook_private_manifest_persistence_static_integration_owner_review_passed_with_warnings_ready_for_static_integration_source_gate_no_execution",
  "allowedClaims": {
    "staticIntegrationPlanReviewed": true,
    "sourceGateMayProceed": true,
    "soundCpuToolsCovered": 15,
    "supabaseClassificationNoOp": true
  },
  "forbiddenClaims": {
    "runtimeSourceModifiedToday": false,
    "persistManifestToday": false,
    "touchSupabaseEnvironmentToday": false,
    "runSqlToday": false,
    "createStorageObjectsToday": false,
    "createSignedUrlToday": false,
    "dispatchWorkerToday": false,
    "openMediaFileToday": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "workerReadinessClaimed": false,
    "externalAgentExecutionReadyClaimed": false,
    "realUserMediaBetaReadyClaimed": false,
    "productionReadinessClaimed": false
  }
}
```

The owner-review claim is narrow: a later source gate may proceed. It is not a runtime, worker, media, storage, Supabase, beta, production, fixture, or dry-run pass claim.
