# WORKER_RUNTIME_JOBS SOUND CPU Phase 90 Issue Coverage Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-issue-coverage-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase90-caption-render-runtime-hook-issue-coverage-owner-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "reviewedIssueCodes": [
    "missing_required_field",
    "invalid_worker_name",
    "invalid_job_type",
    "invalid_private_media_asset_id",
    "invalid_planned_private_artifact_id",
    "runtime_flag_must_remain_false"
  ],
  "reviewedDisallowedFieldPolicy": {
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
  "ownerDecision": {
    "issueCoverageAccepted": true,
    "staticValidationOnly": true,
    "createManifestToday": false,
    "openMediaFileToday": false,
    "createArtifactToday": false
  }
}
```

The reviewed coverage is limited to shape, boundary, and runtime-default validation issues.
