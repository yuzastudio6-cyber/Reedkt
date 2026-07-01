# WORKER_RUNTIME_JOBS SOUND CPU Phase 93 Private Manifest Allowed Persisted Fields Plan

```json worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-allowed-persisted-fields-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-private-manifest-allowed-persisted-fields-plan",
  "allowedFutureManifestFields": [
    "schemaVersion",
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "jobType",
    "privateMediaAssetIds",
    "plannedPrivateArtifactIds",
    "runtimeDefaults"
  ],
  "allowedWorkerNames": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "allowedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "fieldPolicies": {
    "privateMediaAssetIds": "opaque_private_references_only",
    "plannedPrivateArtifactIds": "opaque_private_references_only",
    "runtimeDefaults": "all_flags_must_remain_false_until_later_owner_gate",
    "rawPromptText": "rejected",
    "rawMediaPaths": "rejected",
    "signedUrls": "rejected",
    "providerOutputBlobs": "rejected",
    "serviceRolePayloads": "rejected",
    "secretValues": "rejected"
  }
}
```

Only opaque references and false runtime defaults are planned as future persisted manifest data.
