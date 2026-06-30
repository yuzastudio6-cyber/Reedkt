# WORKER_RUNTIME_JOBS SOUND CPU Phase 60 Caption Render Runtime Hook Blocked-State Source Runtime Integration Controlled Hook Execution Proof Result Register

```json worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase60-caption-render-runtime-hook-blocked-state-source-runtime-integration-controlled-hook-execution-proof-result-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase60_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_proof_passed_with_warnings_ready_for_controlled_hook_execution_owner_review_no_media_no_artifacts",
  "syntheticInputUsed": {
    "approvedPlanSnapshotId": "phase60-synthetic-approved-plan",
    "phase37eRunId": "phase60-synthetic-ocr-caption-run",
    "captionCandidateZoneCount": 2,
    "ocrRegionBoxCount": 1,
    "hashedOcrRegionIdCount": 1,
    "lowerThirdCollisionFlagCount": 1,
    "manualReviewRequiredFlagCount": 1,
    "rawMediaInputs": 0,
    "artifactTargets": 0
  },
  "observedResult": {
    "blockedStatus": "blocked_by_owner_gate",
    "hookName": "ocrCaptionRenderSafeZonePlanningHook",
    "sourceStatus": "source_created_execution_blocked",
    "ownerGateRequired": "WORKER_RUNTIME_JOBS",
    "candidateZoneCount": 2,
    "ocrRegionCount": 1,
    "hashedOcrRegionIdCount": 1,
    "lowerThirdCollisionFlagCount": 1,
    "manualReviewRequiredFlagCount": 1,
    "blockedCandidateZoneCount": 1,
    "saferCandidateZoneCount": 1,
    "rejectedInputs": [
      "rawFrames",
      "rawOcrTextFromControlledMedia",
      "mediaFilePathsForExecution",
      "signedUrlsAsSourceOfTruth",
      "serviceRolePayloads",
      "providerOutputBlobs",
      "artifactWriteTargets"
    ],
    "manualCaptionLayoutReviewRequired": true,
    "runtimeDisabledFlags": {
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
      "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
      "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
      "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0"
    },
    "runtimeExecutionApproved": false,
    "workerExecutionApproved": false,
    "renderExecutionApproved": false,
    "mediaProcessingApproved": false,
    "artifactCreationApproved": false,
    "noArtifactCreated": true
  },
  "proofInspectionOnly": true
}
```

The controlled proof result remained fail-closed and preserved rejected-input policy.
