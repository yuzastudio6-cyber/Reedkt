# WORKER_RUNTIME_JOBS SOUND CPU Phase 75 Private Media Asset ID Contract Validation Register

```json worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-media-asset-id-contract-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase75-caption-render-runtime-hook-private-media-asset-id-contract-validation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceBoundaryDoc": "docs/worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-boundary-owner-review-register.md",
  "validatedStaticContract": {
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
    "realMediaUsedToday": false,
    "mediaFileOpenedToday": false,
    "audioreadOpenApprovedToday": false,
    "pydubMediaOperationApprovedToday": false,
    "ffmpegFfprobeApprovedToday": false
  }
}
```

The media input boundary is validated as identifier-only. No media bytes, file paths, signed URLs, or provider blobs are accepted as runtime source of truth in this phase.
