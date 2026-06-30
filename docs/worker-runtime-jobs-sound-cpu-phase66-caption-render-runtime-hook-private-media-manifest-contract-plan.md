# WORKER_RUNTIME_JOBS SOUND CPU Phase 66 Caption Render Runtime Hook Private Media Manifest Contract Plan

```json worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-media-manifest-contract-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase66-caption-render-runtime-hook-private-media-manifest-contract-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase66_caption_render_runtime_hook_private_manifest_artifact_policy_plan_completed_with_warnings_ready_for_private_manifest_artifact_policy_owner_review_no_media_no_artifacts",
  "manifestContract": {
    "manifestId": "required_future_field",
    "approvedPlanSnapshotId": "required",
    "workspaceId": "required",
    "projectId": "required",
    "jobId": "required",
    "idempotencyKey": "required",
    "phase37eRunId": "required",
    "mediaAssetRefs": "private_manifest_references_only",
    "mediaByteAccess": "blocked_until_later_execution_gate",
    "signedUrlsAsSourceOfTruth": false,
    "serviceRolePayloadsAllowed": false,
    "rawFramesAllowed": false,
    "rawOcrTextAllowed": false,
    "providerOutputBlobsAllowed": false
  },
  "allowedToday": {
    "contractPlanning": true,
    "manifestCreation": false,
    "manifestPersistence": false,
    "mediaOpen": false,
    "mediaRead": false,
    "signedUrlFetch": false,
    "supabaseReadOrWrite": false
  }
}
```

The private media manifest is only a future contract here. No manifest row, object, or media reference is created.
