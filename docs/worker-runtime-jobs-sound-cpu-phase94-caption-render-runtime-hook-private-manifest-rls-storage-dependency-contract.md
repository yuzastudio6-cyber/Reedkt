# WORKER_RUNTIME_JOBS SOUND CPU Phase 94 Private Manifest RLS Storage Dependency Contract

```json worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-dependency-contract
{
  "label": "worker-runtime-jobs-sound-cpu-phase94-caption-render-runtime-hook-private-manifest-rls-storage-dependency-contract",
  "sourceHandoffDecision": "supabase_rls_storage_database_sound_cpu_private_manifest_persistence_handoff_review_passed_with_warnings_ready_for_manifest_persistence_contract_plan_no_execution",
  "futureDatabaseDependencies": {
    "workspaceScopedRlsRequired": true,
    "projectScopedRlsRequired": true,
    "approvedPlanSnapshotReferenceRequired": true,
    "workerJobReferenceRequired": true,
    "auditEventReferenceRequired": true,
    "userDirectWorkerTableWritesRejected": true,
    "publicManifestReadRejected": true
  },
  "candidateTablesForLaterOwnerReview": [
    "approved_plan_snapshots",
    "editing_jobs",
    "job_steps",
    "worker_events",
    "audit_events",
    "media_assets",
    "generated_assets"
  ],
  "futureStorageDependencies": {
    "privateBucketsRequired": true,
    "opaqueStorageReferencesOnly": true,
    "signedUrlsRejectedAsSourceOfTruth": true,
    "publicArtifactsRejected": true,
    "bucketCreationRequiresLaterOwnerGate": true,
    "objectCreationRequiresLaterOwnerGate": true
  },
  "currentGateState": {
    "createMigrationToday": false,
    "runSqlToday": false,
    "touchSupabaseEnvironmentToday": false,
    "createStorageBucketToday": false,
    "writeDatabaseRowsToday": false,
    "createStorageObjectsToday": false,
    "persistManifestToday": false,
    "createSignedUrlToday": false
  }
}
```

The contract records dependencies for later Supabase/RLS/storage implementation planning. It does not select a live table, create a bucket, run SQL, or write storage objects.
