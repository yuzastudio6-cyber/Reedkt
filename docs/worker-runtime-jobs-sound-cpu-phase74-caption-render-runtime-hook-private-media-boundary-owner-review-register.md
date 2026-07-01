# WORKER_RUNTIME_JOBS SOUND CPU Phase 74 Private Media Boundary Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-boundary-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-boundary-owner-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceBoundaryDoc": "docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-read-boundary-plan.md",
  "acceptedStaticChecks": {
    "privateMediaAssetIdsRequired": true,
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "rawMediaPathsRejected": true,
    "signedUrlsRejectedAsSourceOfTruth": true,
    "providerOutputBlobsRejected": true
  },
  "executionState": {
    "mediaFileOpenApprovedToday": false,
    "audioreadOpenApprovedToday": false,
    "pydubMediaOperationApprovedToday": false,
    "ffmpegFfprobeApprovedToday": false,
    "workerRuntimeMediaReadApprovedToday": false,
    "ownerGateRequired": "SOUND_RUNTIME_MEDIA_GATE"
  }
}
```

The media boundary can be statically validated against identifiers and prohibitions. It cannot open or process real media in this gate.
