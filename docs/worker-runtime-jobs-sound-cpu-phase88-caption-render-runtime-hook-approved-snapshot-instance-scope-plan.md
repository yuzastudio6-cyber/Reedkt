# WORKER_RUNTIME_JOBS SOUND CPU Phase 88 Approved Snapshot Instance Scope Plan

```json worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase88-caption-render-runtime-hook-approved-snapshot-instance-scope-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "approvedSnapshotScope": {
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "rawPromptRejected": true,
    "unapprovedPlanRejected": true,
    "serviceRolePayloadRejected": true
  },
  "executionState": {
    "createManifestToday": false,
    "persistManifestToday": false,
    "dispatchWorkerToday": false,
    "touchSupabaseSqlToday": false
  }
}
```

Every future manifest instance must be approved-snapshot scoped; this gate creates no instance.
