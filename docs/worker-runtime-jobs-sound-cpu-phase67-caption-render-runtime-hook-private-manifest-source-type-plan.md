# WORKER_RUNTIME_JOBS SOUND CPU Phase 67 Caption Render Runtime Hook Private Manifest Source Type Plan

```json worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-type-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-source-type-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase67_caption_render_runtime_hook_private_manifest_source_plan_completed_with_warnings_ready_for_private_manifest_source_owner_review_no_media_no_artifacts",
  "futureSource": {
    "path": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "createToday": false,
    "sourceKind": "typescript_types_and_static_validators_future_gate",
    "manifestTypeName": "SoundCpuPrivateMediaManifest",
    "manifestInputTypeName": "SoundCpuPrivateMediaManifestInput",
    "manifestValidationResultTypeName": "SoundCpuPrivateMediaManifestValidationResult"
  },
  "plannedRequiredFields": [
    "manifestId",
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "phase37eRunId",
    "workerName",
    "imageName",
    "jobType",
    "mediaAssetRefs",
    "artifactOutputPolicy",
    "runtimeFlags"
  ],
  "plannedBlockedPayloadFields": [
    "rawPrompt",
    "signedUrlAsSourceOfTruth",
    "serviceRolePayload",
    "rawFrameBytes",
    "rawOcrText",
    "providerOutputBlob",
    "modelWeightLocation",
    "artifactWriteTarget"
  ],
  "allowedToday": {
    "typePlanning": true,
    "sourceFileCreation": false,
    "manifestCreation": false,
    "mediaReferenceCreation": false,
    "artifactReferenceCreation": false,
    "supabaseReadOrWrite": false
  }
}
```

The future source type plan is intentionally inert until a separate owner-reviewed source-creation gate.
