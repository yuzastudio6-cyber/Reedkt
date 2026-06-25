# SOUND Runtime Media Gate 2F Rejection Validation Register

```json sound-runtime-media-gate-2f-rejection-validation-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2F",
  "decision": "sound_runtime_media_gate_2f_controlled_synthetic_route_source_validation_passed_with_warnings_ready_for_validation_owner_review",
  "validatedRejectedPayloadFields": [
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
  "validatedFailureReasons": [
    "rejected_payload_field",
    "missing_required_field",
    "invalid_required_field",
    "invalid_runtime_flags",
    "unsafe_runtime_flag",
    "unknown_job_type",
    "worker_mismatch",
    "image_mismatch",
    "fixture_mismatch"
  ],
  "rejectionValidationPassed": true
}
```
