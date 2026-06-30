# WORKER_RUNTIME_JOBS SOUND CPU Phase 63 Caption Render Runtime Hook Synthetic Input Map Register

```json worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-synthetic-input-map-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-synthetic-input-map-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_plan_owner_review_no_media_no_artifacts",
  "acceptedSyntheticInputs": {
    "syntheticCaptionBoxes": true,
    "syntheticSafeZoneBounds": true,
    "syntheticFrameDimensions": true,
    "syntheticToolInvocationMetadata": true,
    "syntheticNoArtifactManifest": true
  },
  "rejectedInputs": [
    "rawFrames",
    "rawOcrTextFromControlledMedia",
    "mediaFilePathsForExecution",
    "signedUrlsAsSourceOfTruth",
    "serviceRolePayloads",
    "providerOutputBlobs",
    "artifactWriteTargets",
    "modelWeightLocations",
    "secretPayloads"
  ],
  "inputPolicy": {
    "realMediaAllowed": false,
    "browserCaptureAllowed": false,
    "ffmpegAllowed": false,
    "providerOutputAllowed": false,
    "supabaseStorageAllowed": false
  }
}
```

The future proof may use synthetic metadata only. Real user media and artifact inputs remain rejected.
