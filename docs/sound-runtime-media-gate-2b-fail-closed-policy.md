# SOUND Runtime Media Gate 2B Fail-Closed Policy

```json sound-runtime-media-gate-2b-fail-closed-policy
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2B",
  "decision": "sound_runtime_media_gate_2b_synthetic_worker_route_plan_completed_with_warnings_ready_for_route_owner_review",
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
    "mediaFileOpenEnabled": false,
    "audioreadAudioOpenEnabled": false,
    "pydubFileImportExportEnabled": false,
    "ffmpegEnabled": false,
    "ffprobeEnabled": false,
    "dockerRunEnabled": false,
    "dockerPushEnabled": false,
    "gcpEnabled": false,
    "supabaseEnabled": false,
    "sqlEnabled": false,
    "artifactWriteEnabled": false,
    "workerExecutionEnabled": false,
    "routeExecutionEnabled": false
  },
  "failureMode": "reject_before_execution",
  "sanitizationRequired": true
}
```
