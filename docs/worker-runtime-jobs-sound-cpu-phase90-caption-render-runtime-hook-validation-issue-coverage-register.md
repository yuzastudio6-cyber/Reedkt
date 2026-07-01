# WORKER_RUNTIME_JOBS SOUND CPU Phase 90 Validation Issue Coverage Register

```json worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-validation-issue-coverage-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-validation-issue-coverage-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "validatedIssueCodes": [
    "missing_required_field",
    "invalid_worker_name",
    "invalid_job_type",
    "invalid_private_media_asset_id",
    "invalid_planned_private_artifact_id",
    "runtime_flag_must_remain_false"
  ],
  "validatedDisallowedFieldPolicy": {
    "rawPromptAbsentFromValidInput": true,
    "rawMediaPathAbsentFromValidInput": true,
    "signedUrlAbsentFromValidInput": true,
    "publicArtifactUrlAbsentFromValidInput": true,
    "providerOutputBlobAbsentFromValidInput": true,
    "serviceRolePayloadAbsentFromValidInput": true,
    "artifactWriteTargetAbsentFromValidInput": true,
    "modelWeightLocationAbsentFromValidInput": true,
    "secretValueAbsentFromValidInput": true
  },
  "executionState": {
    "staticValidationOnly": true,
    "createManifestToday": false,
    "openMediaFileToday": false,
    "createArtifactToday": false
  }
}
```

Issue coverage is limited to static shape validation.
