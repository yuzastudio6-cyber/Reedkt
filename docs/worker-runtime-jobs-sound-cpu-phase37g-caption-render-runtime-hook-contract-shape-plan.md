# WORKER_RUNTIME_JOBS SOUND CPU Phase 37G Caption Render Runtime Hook Contract Shape Plan

```json worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-contract-shape-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase37g-caption-render-runtime-hook-contract-shape-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37g_caption_render_runtime_hook_source_plan_completed_with_warnings_ready_for_source_owner_review_no_execution",
  "plannedTypes": {
    "inputType": "SoundCpuOcrCaptionRenderSafeZoneHookInput",
    "resultType": "SoundCpuOcrCaptionRenderSafeZoneHookResult",
    "blockedResultFactory": "createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult"
  },
  "plannedInputCategories": [
    "approvedPlanSnapshotId",
    "phase37eRunId",
    "captionCandidateZoneMetadata",
    "normalizedOcrRegionBoxes",
    "hashedOcrRegionIds",
    "lowerThirdCollisionFlags",
    "manualReviewRequiredFlags",
    "runtimeDisabledFlags"
  ],
  "plannedResultCategories": [
    "blockedStatus",
    "blockedReason",
    "captionSafeZoneConstraintPlan",
    "manualCaptionLayoutReviewRequired",
    "noArtifactCreated",
    "ownerGateRequired"
  ],
  "requiredFailClosedDefaults": {
    "runtimeHookImplementationApprovedToday": false,
    "captionRenderRuntimeHookExecutionApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "renderExecutionApprovedToday": false,
    "artifactCreationApprovedToday": false
  },
  "rejectedInputs": [
    "rawFrames",
    "rawOcrTextFromControlledMedia",
    "mediaFilePathsForExecution",
    "signedUrlsAsSourceOfTruth",
    "serviceRolePayloads",
    "providerOutputBlobs",
    "artifactWriteTargets"
  ]
}
```

The future contract shape must be static and fail-closed. It may not open files, parse media bytes, call OCR, dispatch workers, call routes, or write artifacts.
