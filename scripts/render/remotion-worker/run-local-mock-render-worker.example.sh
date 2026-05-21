#!/usr/bin/env bash
set -euo pipefail

# RP-RENDER-02 example only.
# This does not render media, access GCS, read secrets, call providers, or run Remotion.
# It sketches how a future local mock runner can pass JSON into the TypeScript entrypoint.

cat <<'JSON'
{
  "renderJobId": "render_job_mock_001",
  "jobId": "job_mock_render_001",
  "workspaceId": "workspace_mock_001",
  "projectId": "project_mock_001",
  "approvedPlanSnapshotId": "snapshot_mock_001",
  "editPlanId": "edit_plan_mock_001",
  "creditReservationId": "credit_reservation_mock_001",
  "renderType": "preview",
  "renderQualityLevel": "draft",
  "outputFormat": "mp4",
  "width": 1080,
  "height": 1920,
  "frameRate": 30,
  "durationSeconds": 12,
  "timelineSpec": {
    "masterTimingPlanId": "master_timing_mock_001",
    "layers": [
      {
        "layerId": "layer_mock_001",
        "startFrame": 0,
        "endFrame": 360
      }
    ]
  },
  "sourceAssetLocations": [],
  "generatedAssetLocations": [],
  "outputBucketPurpose": "previews",
  "outputObjectPath": "workspaces/workspace_mock_001/projects/project_mock_001/previews/render_preview_mock_001.mp4",
  "idempotencyKey": "render-preview-project_mock_001-snapshot_mock_001-v1",
  "metadata": {
    "mockOnly": true
  }
}
JSON

echo "Example payload only. Import runRemotionWorkerEntrypoint from src/backend/render/remotion-worker in a future mock runner."
