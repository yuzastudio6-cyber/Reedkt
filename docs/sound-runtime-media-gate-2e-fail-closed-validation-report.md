# SOUND Runtime Media Gate 2E Fail-Closed Validation Report

```json sound-runtime-media-gate-2e-fail-closed-validation-report
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2E",
  "decision": "sound_runtime_media_gate_2e_actual_synthetic_worker_route_source_created_with_warnings_ready_for_source_owner_review",
  "failClosedBehavior": {
    "rejectsUnsafePayloadFields": true,
    "rejectsMissingRequiredFields": true,
    "rejectsUnknownJobTypes": true,
    "rejectsWorkerMismatch": true,
    "rejectsImageMismatch": true,
    "rejectsFixtureMismatch": true,
    "requiresAllRuntimeFlagsFalse": true
  },
  "rejectedPayloadFields": [
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
  "runtimeFlagsRequiredFalse": [
    "mediaFileOpenEnabled",
    "audioreadAudioOpenEnabled",
    "pydubFileImportExportEnabled",
    "ffmpegEnabled",
    "ffprobeEnabled",
    "dockerRunEnabled",
    "dockerPushEnabled",
    "gcpEnabled",
    "supabaseEnabled",
    "sqlEnabled",
    "artifactWriteEnabled",
    "workerExecutionEnabled",
    "routeExecutionEnabled"
  ]
}
```
