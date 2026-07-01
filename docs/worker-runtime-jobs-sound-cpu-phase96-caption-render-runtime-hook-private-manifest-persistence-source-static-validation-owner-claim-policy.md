# WORKER_RUNTIME_JOBS SOUND CPU Phase 96 Private Manifest Persistence Source Static Validation Owner Claim Policy

```json worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-claim-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-validation-owner-claim-policy",
  "decision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_owner_review_passed_with_warnings_ready_for_private_manifest_persistence_static_integration_plan_no_execution",
  "allowedClaims": {
    "privateManifestPersistenceSourceStaticValidationOwnerReviewPassed": true,
    "privateManifestPersistenceStaticIntegrationPlanMayProceed": true
  },
  "blockedClaims": {
    "persistManifestToday": false,
    "createMigrationToday": false,
    "runSqlToday": false,
    "touchSupabaseEnvironmentToday": false,
    "createStorageBucketToday": false,
    "writeDatabaseRowsToday": false,
    "createStorageObjectsToday": false,
    "createSignedUrlToday": false,
    "createPublicArtifactToday": false,
    "dispatchWorkerToday": false,
    "openMediaFileToday": false,
    "routeExecutionEnabledToday": false,
    "providerCallEnabledToday": false,
    "modelCallEnabledToday": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "workerReadinessClaimed": false,
    "realUserMediaBetaReadyClaimed": false,
    "productionReadinessClaimed": false,
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

Only owner-review and next static-integration-planning claims are allowed. Runtime and persistence claims remain blocked.
