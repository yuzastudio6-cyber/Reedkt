# WORKER_RUNTIME_JOBS SOUND CPU Phase 65 Caption Render Runtime Hook Real Media Input Readiness Register

```json worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-input-readiness-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase65-caption-render-runtime-hook-real-media-input-readiness-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase65_caption_render_runtime_hook_real_media_artifact_readiness_plan_completed_with_warnings_ready_for_real_media_artifact_readiness_plan_owner_review_no_media_no_artifacts",
  "futureInputRequirements": {
    "approvedPlanSnapshotId": "required",
    "phase37eRunId": "required",
    "workspaceId": "required",
    "projectId": "required",
    "jobId": "required",
    "idempotencyKey": "required",
    "privateMediaManifestId": "required_before_real_media",
    "normalizedOcrRegionBoxes": "hashed_metadata_only",
    "hashedOcrRegionIds": "required",
    "captionCandidateZones": "required",
    "lowerThirdCollisionFlags": "allowed_metadata_only",
    "manualReviewRequiredFlags": "allowed_metadata_only"
  },
  "rejectedInputsUntilLaterGate": [
    "rawFrames",
    "rawOcrTextFromControlledMedia",
    "mediaFilePathsForExecution",
    "signedUrlsAsSourceOfTruth",
    "serviceRolePayloads",
    "providerOutputBlobs",
    "artifactWriteTargets"
  ],
  "allowedToday": {
    "syntheticMetadataPlanning": true,
    "realMediaBytes": false,
    "mediaFileOpen": false,
    "signedUrlFetch": false,
    "ocrInference": false,
    "workerExecution": false
  }
}
```

Real-media input readiness requires private manifest planning and owner review before any file bytes, signed URLs, or OCR execution can be used.
