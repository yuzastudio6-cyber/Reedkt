# SOUND Runtime Media Gate 2E Route Contract Implementation Register

```json sound-runtime-media-gate-2e-route-contract-implementation-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2E",
  "decision": "sound_runtime_media_gate_2e_actual_synthetic_worker_route_source_created_with_warnings_ready_for_source_owner_review",
  "routeContracts": [
    {
      "jobType": "sound.package_import_smoke",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "syntheticFixtureDescriptor": "package-import-smoke-no-media",
      "decisionMode": "synthetic_package_import_route_only"
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "syntheticFixtureDescriptor": "numeric-array-analysis-no-media",
      "decisionMode": "synthetic_numeric_array_route_only"
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "syntheticFixtureDescriptor": "symbolic-midi-in-memory-no-file",
      "decisionMode": "synthetic_symbolic_midi_route_only"
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "syntheticFixtureDescriptor": "loudness-synthetic-array-no-media",
      "decisionMode": "synthetic_loudness_route_only"
    }
  ],
  "requiredStaticFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "attemptMetadata",
    "syntheticFixtureDescriptor",
    "staticOnlyRuntimeFlags"
  ]
}
```
