# WORKER_RUNTIME_JOBS SOUND CPU Phase 137 Private Media Manifest RLS Plan

```json worker-runtime-jobs-sound-cpu-phase137-private-media-manifest-rls-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase137-private-media-manifest-rls-plan",
  "decision": "worker_runtime_jobs_sound_cpu_phase137_supabase_private_storage_rls_plan_completed_with_warnings_ready_for_rls_owner_review",
  "plannedTables": [
    {
      "table": "media_assets",
      "rlsIntent": "workspace_project_member_select_backend_service_write",
      "userInsertAllowed": false,
      "userUpdateAllowed": false,
      "serviceWriteRequired": true,
      "migrationCreatedInThisGate": false
    },
    {
      "table": "approved_plan_snapshots",
      "rlsIntent": "workspace_project_member_select_service_insert_immutable",
      "userInsertAllowed": false,
      "userUpdateAllowed": false,
      "serviceWriteRequired": true,
      "migrationCreatedInThisGate": false
    },
    {
      "table": "editing_jobs",
      "rlsIntent": "workspace_project_member_select_service_only_write",
      "userInsertAllowed": false,
      "userUpdateAllowed": false,
      "serviceWriteRequired": true,
      "migrationCreatedInThisGate": false
    },
    {
      "table": "worker_events",
      "rlsIntent": "workspace_project_member_select_service_only_append",
      "userInsertAllowed": false,
      "userUpdateAllowed": false,
      "serviceWriteRequired": true,
      "migrationCreatedInThisGate": false
    }
  ],
  "manifestRequirements": {
    "privateMediaManifestIdRequired": true,
    "approvedPlanSnapshotIdRequired": true,
    "workspaceProjectScopeRequired": true,
    "serviceRoleWorkerWritesOnly": true,
    "userDirectWorkerTableWritesAllowed": false,
    "rawPromptAsManifestAllowed": false,
    "signedUrlAsSourceOfTruthAllowed": false
  }
}
```

Future route work must reference project-scoped private manifests and immutable approved snapshots. This file is not a migration.
