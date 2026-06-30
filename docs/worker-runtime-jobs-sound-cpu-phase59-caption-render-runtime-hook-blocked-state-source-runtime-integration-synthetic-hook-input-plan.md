# WORKER_RUNTIME_JOBS SOUND CPU Phase 59 Caption Render Runtime Hook Blocked-State Source Runtime Integration Synthetic Hook Input Plan

```json worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-synthetic-hook-input-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase59-caption-render-runtime-hook-blocked-state-source-runtime-integration-synthetic-hook-input-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase59_caption_render_runtime_hook_blocked_state_source_runtime_integration_controlled_hook_execution_plan_completed_with_warnings_ready_for_controlled_hook_execution_proof_no_media_no_artifacts",
  "futureProofInput": {
    "approvedPlanSnapshotId": "phase60-synthetic-approved-plan",
    "phase37eRunId": "phase60-synthetic-ocr-caption-run",
    "captionCandidateZones": [
      {
        "zoneId": "phase60-zone-safe",
        "label": "synthetic safe lower-third alternative",
        "normalizedBox": {
          "x": 0.08,
          "y": 0.72,
          "width": 0.84,
          "height": 0.18
        },
        "collisionRisk": "low"
      },
      {
        "zoneId": "phase60-zone-blocked",
        "label": "synthetic blocked lower-third overlap",
        "normalizedBox": {
          "x": 0.1,
          "y": 0.76,
          "width": 0.8,
          "height": 0.2
        },
        "collisionRisk": "blocking"
      }
    ],
    "normalizedOcrRegionBoxes": [
      {
        "regionIdHash": "phase60-region-hash-a",
        "normalizedBox": {
          "x": 0.12,
          "y": 0.73,
          "width": 0.31,
          "height": 0.07
        },
        "confidenceBand": "high"
      }
    ],
    "hashedOcrRegionIds": ["phase60-region-hash-a"],
    "lowerThirdCollisionFlags": ["synthetic_lower_third_collision"],
    "manualReviewRequiredFlags": ["synthetic_manual_review_required"],
    "runtimeDisabledFlags": {
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
      "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
      "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
      "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0"
    }
  },
  "expectedFailClosedResultShape": {
    "blockedStatus": "blocked_by_owner_gate",
    "candidateZoneCount": 2,
    "ocrRegionCount": 1,
    "blockedCandidateZoneCount": 1,
    "saferCandidateZoneCount": 1,
    "manualCaptionLayoutReviewRequired": true,
    "runtimeExecutionApproved": false,
    "workerExecutionApproved": false,
    "renderExecutionApproved": false,
    "mediaProcessingApproved": false,
    "artifactCreationApproved": false,
    "noArtifactCreated": true
  },
  "inputPolicy": {
    "syntheticMetadataOnly": true,
    "rawFramesAllowed": false,
    "rawOcrTextAllowed": false,
    "mediaFilePathsAllowed": false,
    "signedUrlsAllowed": false,
    "serviceRolePayloadsAllowed": false,
    "providerOutputBlobsAllowed": false,
    "artifactWriteTargetsAllowed": false
  }
}
```

The future proof input uses deterministic synthetic metadata only. It contains no media bytes, file paths, raw OCR text, provider output, service-role payload, signed URL, or artifact target.
