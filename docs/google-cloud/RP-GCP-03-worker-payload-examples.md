# RP-GCP-03 Worker Payload Examples

## Purpose

These examples are fake, mock-only payload shapes for future workers. They use fake IDs and canonical GCS object paths only. They do not contain signed URLs, secrets, provider keys, real project IDs, or executable commands.

## Media Analysis Worker

```json
{
  "jobId": "job_fake_media_001",
  "workspaceId": "ws_fake_001",
  "projectId": "prj_fake_001",
  "approvedPlanSnapshotId": "snap_fake_001",
  "editPlanId": "plan_fake_001",
  "workerType": "media_analysis_worker",
  "executionMode": "analysis_worker",
  "sourceAssetIds": ["asset_source_001", "asset_source_002"],
  "segmentIds": [],
  "operationIds": [],
  "visualAssetPlanItemIds": [],
  "rendererLayerIds": [],
  "toolStrategyItemIds": ["tool_strategy_media_analysis_001"],
  "idempotencyKey": "media-analysis-prj_fake_001-snap_fake_001-v1",
  "attempt": 1,
  "maxAttempts": 3,
  "requestedAt": "2026-05-19T12:00:00.000Z",
  "metadata": {
    "sourceOrderRequired": true,
    "approvedSnapshotRequired": true
  }
}
```

## Image Asset Worker

```json
{
  "jobId": "job_fake_image_001",
  "workspaceId": "ws_fake_001",
  "projectId": "prj_fake_001",
  "approvedPlanSnapshotId": "snap_fake_001",
  "editPlanId": "plan_fake_001",
  "creditReservationId": "reservation_fake_001",
  "workerType": "image_asset_worker",
  "executionMode": "generation_worker",
  "sourceAssetIds": ["asset_source_001"],
  "segmentIds": ["segment_fake_001"],
  "operationIds": ["operation_fake_card_001"],
  "visualAssetPlanItemIds": ["visual_asset_plan_fake_001"],
  "rendererLayerIds": ["layer_fake_card_001"],
  "toolStrategyItemIds": [],
  "idempotencyKey": "image-asset-prj_fake_001-snap_fake_001-visual_asset_plan_fake_001",
  "attempt": 1,
  "maxAttempts": 2,
  "requestedAt": "2026-05-19T12:01:00.000Z",
  "metadata": {
    "providerRoute": "gpt_image_2",
    "promptPlanId": "prompt_plan_fake_001"
  }
}
```

## AI Video Asset Worker

```json
{
  "jobId": "job_fake_ai_video_001",
  "workspaceId": "ws_fake_001",
  "projectId": "prj_fake_001",
  "approvedPlanSnapshotId": "snap_fake_001",
  "editPlanId": "plan_fake_001",
  "creditReservationId": "reservation_fake_001",
  "workerType": "ai_video_asset_worker",
  "executionMode": "generation_worker",
  "sourceAssetIds": ["asset_keyframe_start_001", "asset_keyframe_end_001"],
  "segmentIds": ["segment_fake_002"],
  "operationIds": ["operation_fake_motion_001"],
  "visualAssetPlanItemIds": ["visual_asset_plan_fake_002"],
  "rendererLayerIds": ["layer_fake_motion_001"],
  "toolStrategyItemIds": [],
  "idempotencyKey": "ai-video-prj_fake_001-snap_fake_001-visual_asset_plan_fake_002",
  "attempt": 1,
  "maxAttempts": 2,
  "requestedAt": "2026-05-19T12:02:00.000Z",
  "metadata": {
    "providerRoute": "wan",
    "fallbackRoutes": ["hailuo"],
    "veoAllowed": false,
    "panelBackground": "near-white"
  }
}
```

## Remotion Render Worker

```json
{
  "renderJobId": "render_job_fake_001",
  "jobId": "job_fake_render_001",
  "workspaceId": "ws_fake_001",
  "projectId": "prj_fake_001",
  "approvedPlanSnapshotId": "snap_fake_001",
  "editPlanId": "plan_fake_001",
  "creditReservationId": "reservation_fake_001",
  "renderType": "preview",
  "renderQualityLevel": "standard",
  "outputFormat": "mp4",
  "width": 1080,
  "height": 1920,
  "frameRate": 30,
  "durationSeconds": 42,
  "timelineSpec": {
    "masterTimingPlanId": "master_timing_fake_001",
    "frameLayoutPlanId": "frame_layout_fake_001",
    "layers": [
      {
        "layerId": "layer_fake_motion_001",
        "startFrame": 0,
        "endFrame": 150
      }
    ]
  },
  "sourceAssetLocations": [
    {
      "bucketPurpose": "source_media",
      "bucketName": "reeditpro-prod-source-media",
      "objectPath": "workspaces/ws_fake_001/projects/prj_fake_001/source-media/src_clip_001.mov",
      "signedUrlRequired": true,
      "publicUrlAllowed": false
    }
  ],
  "generatedAssetLocations": [
    {
      "bucketPurpose": "generated_assets",
      "bucketName": "reeditpro-prod-generated-assets",
      "objectPath": "workspaces/ws_fake_001/projects/prj_fake_001/generated-assets/videos/ai_clip_001.mp4",
      "signedUrlRequired": true,
      "publicUrlAllowed": false
    }
  ],
  "outputBucketPurpose": "previews",
  "outputObjectPath": "workspaces/ws_fake_001/projects/prj_fake_001/previews/render_preview_001.mp4",
  "idempotencyKey": "render-preview-prj_fake_001-snap_fake_001-v1",
  "metadata": {
    "previewOnly": true
  }
}
```

## QA Worker

```json
{
  "jobId": "job_fake_qa_001",
  "workspaceId": "ws_fake_001",
  "projectId": "prj_fake_001",
  "approvedPlanSnapshotId": "snap_fake_001",
  "editPlanId": "plan_fake_001",
  "workerType": "qa_worker",
  "executionMode": "qa_worker",
  "sourceAssetIds": ["render_fake_preview_001"],
  "segmentIds": ["segment_fake_001", "segment_fake_002"],
  "operationIds": [],
  "visualAssetPlanItemIds": [],
  "rendererLayerIds": ["layer_fake_card_001", "layer_fake_motion_001"],
  "toolStrategyItemIds": ["tool_strategy_qa_001"],
  "idempotencyKey": "qa-prj_fake_001-snap_fake_001-render_fake_preview_001",
  "attempt": 1,
  "maxAttempts": 2,
  "requestedAt": "2026-05-19T12:04:00.000Z",
  "metadata": {
    "checks": ["intent_match", "caption_readability", "timing", "model_policy", "credit_compliance"]
  }
}
```

## Export Worker

```json
{
  "jobId": "job_fake_export_001",
  "workspaceId": "ws_fake_001",
  "projectId": "prj_fake_001",
  "approvedPlanSnapshotId": "snap_fake_001",
  "editPlanId": "plan_fake_001",
  "creditReservationId": "reservation_fake_export_001",
  "workerType": "export_worker",
  "executionMode": "export_worker",
  "sourceAssetIds": ["render_fake_final_001"],
  "segmentIds": [],
  "operationIds": [],
  "visualAssetPlanItemIds": [],
  "rendererLayerIds": [],
  "toolStrategyItemIds": ["tool_strategy_export_001"],
  "idempotencyKey": "export-prj_fake_001-snap_fake_001-final-v1",
  "attempt": 1,
  "maxAttempts": 2,
  "requestedAt": "2026-05-19T12:05:00.000Z",
  "metadata": {
    "previewApproved": true,
    "qaPassed": true,
    "exportApproved": true,
    "outputPath": "workspaces/ws_fake_001/projects/prj_fake_001/exports/final_export_001.mp4"
  }
}
```

