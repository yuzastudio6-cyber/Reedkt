# SUPABASE RLS STORAGE DATABASE SOUND CPU Private Manifest Service Role Boundary Review

```json supabase-rls-storage-database-sound-cpu-private-manifest-service-role-boundary-review
{
  "label": "supabase-rls-storage-database-sound-cpu-private-manifest-service-role-boundary-review",
  "owner": "SUPABASE_RLS_STORAGE_DATABASE",
  "serviceRoleBoundary": {
    "futureWorkerScopedServiceRoleWriteReviewRequired": true,
    "futureIdempotentManifestUpsertReviewRequired": true,
    "futureAuditAppendReviewRequired": true,
    "futureRetrySafeMutationReviewRequired": true,
    "broadServiceRoleHandlerEnabledToday": false,
    "serviceRoleSecretCreatedToday": false,
    "serviceRoleSecretReadToday": false,
    "routeHandlerEnabledToday": false,
    "workerDispatchEnabledToday": false
  },
  "futureWriteBoundaryCandidates": [
    "approvedSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "stepId",
    "privateManifestId",
    "manifestSchemaVersion",
    "runtimeDefaults",
    "privateArtifactReferences",
    "idempotencyKey",
    "createdByWorker",
    "auditEventId"
  ],
  "currentGateState": {
    "writeDatabaseRowsToday": false,
    "createStorageObjectsToday": false,
    "persistManifestToday": false,
    "dispatchWorkerToday": false,
    "callRouteToolProviderToday": false,
    "touchSupabaseEnvironmentToday": false
  }
}
```

The future service-role boundary must be narrow, worker-scoped, idempotent, and audited. This review enables no broad service-role handler and performs no write.
