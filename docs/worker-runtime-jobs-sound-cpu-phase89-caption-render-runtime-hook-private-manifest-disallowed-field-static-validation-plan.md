# WORKER_RUNTIME_JOBS SOUND CPU Phase 89 Private Manifest Disallowed Field Static Validation Plan

```json worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-disallowed-field-static-validation-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase89-caption-render-runtime-hook-private-manifest-disallowed-field-static-validation-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "disallowedFieldsToReject": [
    "rawPrompt",
    "rawMediaPath",
    "signedUrl",
    "publicArtifactUrl",
    "providerOutputBlob",
    "serviceRolePayload",
    "artifactWriteTarget",
    "modelWeightLocation",
    "secretValue"
  ],
  "disallowedFieldPolicy": {
    "signedUrlsAreNeverSourceOfTruth": true,
    "publicArtifactsAreNeverSourceOfTruth": true,
    "serviceRolePayloadsRejected": true,
    "secretValuesRejected": true,
    "modelWeightLocationsRejected": true
  },
  "executionState": {
    "providerModelCalledToday": false,
    "touchSupabaseSqlToday": false,
    "createSignedUrlToday": false,
    "createArtifactToday": false
  }
}
```

Disallowed field validation is planned as static shape validation only.
