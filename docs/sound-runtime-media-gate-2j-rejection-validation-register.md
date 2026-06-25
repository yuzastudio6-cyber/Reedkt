# SOUND Runtime Media Gate 2J Rejection Validation Register

```json sound-runtime-media-gate-2j-rejection-validation-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2J",
  "decision": "sound_runtime_media_gate_2j_controlled_route_fixture_validation_passed_with_warnings_ready_for_fixture_validation_owner_review",
  "rejectedPayloadFieldsValidated": [
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
  "rejectedPayloadFieldCount": 14,
  "rejectedPayloadCaseCount": 14,
  "mismatchCasesValidated": [
    "unsafe_runtime_flag",
    "worker_mismatch",
    "image_mismatch",
    "fixture_mismatch",
    "unknown_job_type"
  ],
  "mismatchCaseCount": 5,
  "unsafeRuntimeFlagAccepted": false,
  "unsafePayloadAccepted": false,
  "mediaOrExternalPayloadAccepted": false
}
```
