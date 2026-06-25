# SOUND Runtime Media Gate 2G Synthetic Payload Plan Register

```json sound-runtime-media-gate-2g-synthetic-payload-plan-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2G",
  "decision": "sound_runtime_media_gate_2g_controlled_synthetic_route_execution_plan_completed_with_warnings_ready_for_execution_plan_owner_review",
  "payloadMode": "static_in_memory_synthetic_only",
  "validPayloadShapePlanned": {
    "approvedPlanSnapshotId": "synthetic_static_placeholder",
    "workspaceId": "synthetic_workspace_placeholder",
    "projectId": "synthetic_project_placeholder",
    "jobId": "synthetic_job_placeholder",
    "idempotencyKey": "synthetic_idempotency_placeholder",
    "workerName": "sound-cpu-analysis-worker",
    "imageName": "reeditpro/sound-cpu-analysis-worker",
    "runtimeFlagsAllFalse": true
  },
  "plannedAcceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "plannedRejectedPayloadFieldCount": 14,
  "plannedRuntimeFalseFlagCount": 15,
  "rejectedPayloadSources": [
    "rawPrompt",
    "prompt",
    "signedUrl",
    "publicUrl",
    "mediaPath",
    "providerOutputBlob",
    "serviceRoleKey",
    "databaseUrl",
    "modelWeightPath",
    "artifactWriteTarget",
    "gcsUri",
    "supabaseBucket",
    "ffmpegArgs",
    "dockerCommand"
  ],
  "payloadsCreatedInGate2g": false,
  "payloadsExecutedInGate2g": false
}
```
