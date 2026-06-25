# SOUND Runtime Media Gate 2D Fail-Closed Source Policy

```json sound-runtime-media-gate-2d-fail-closed-source-policy
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2D",
  "decision": "sound_runtime_media_gate_2d_synthetic_worker_route_source_plan_completed_with_warnings_ready_for_source_owner_review",
  "requiredRejectedPayloadFields": [
    "rawPrompt",
    "uploadedMediaUri",
    "signedUrl",
    "publicArtifactUrl",
    "mediaFilePath",
    "providerOutputBlob",
    "secretValue",
    "serviceRolePayload",
    "modelWeightPath",
    "artifactWriteTarget",
    "supabaseMutation",
    "sqlText",
    "dockerCommand",
    "gcpCommand"
  ],
  "requiredRuntimeFlags": {
    "workerExecutionEnabled": false,
    "routeExecutionEnabled": false,
    "toolExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "dockerRunEnabled": false,
    "dockerPushEnabled": false,
    "gcpEnabled": false,
    "supabaseEnabled": false,
    "artifactWriteEnabled": false,
    "internalBetaUnlockEnabled": false,
    "externalBetaUnlockEnabled": false,
    "productionUnlockEnabled": false
  },
  "futureSourceMustFailClosedOn": [
    "unknown job type",
    "unexpected worker or image",
    "missing approvedPlanSnapshotId",
    "missing idempotencyKey",
    "runtime flag set true",
    "forbidden payload field present",
    "media path or signed URL provided",
    "provider/model/GCP/Supabase/Docker command present"
  ]
}
```
