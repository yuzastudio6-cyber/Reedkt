# SOUND Runtime Media Gate 2D Route Contract Source Map

```json sound-runtime-media-gate-2d-route-contract-source-map
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2D",
  "decision": "sound_runtime_media_gate_2d_synthetic_worker_route_source_plan_completed_with_warnings_ready_for_source_owner_review",
  "routeContracts": [
    {
      "jobType": "sound.package_import_smoke",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker",
      "futureDecisionMode": "synthetic_package_import_route_only",
      "sourceImplementationApprovedNow": false
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker",
      "futureDecisionMode": "synthetic_numeric_array_route_only",
      "sourceImplementationApprovedNow": false
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "worker": "sound-audio-metadata-worker",
      "image": "reeditpro/sound-audio-metadata-worker",
      "futureDecisionMode": "synthetic_symbolic_midi_route_only",
      "sourceImplementationApprovedNow": false
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "worker": "sound-audio-metadata-worker",
      "image": "reeditpro/sound-audio-metadata-worker",
      "futureDecisionMode": "synthetic_loudness_route_only",
      "sourceImplementationApprovedNow": false
    }
  ],
  "requiredStaticFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "worker",
    "image",
    "jobType",
    "attempt",
    "runtimeFlags"
  ],
  "rejectedPayloadFieldCount": 14
}
```
