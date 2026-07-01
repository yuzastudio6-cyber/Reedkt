# WORKER_RUNTIME_JOBS SOUND CPU Phase 74 Private Media Read Boundary Plan

```json worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-read-boundary-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase74-caption-render-runtime-hook-private-media-read-boundary-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
  "acceptedInputContractPlanningOnly": {
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "privateMediaAssetIdsRequired": true,
    "allowedSourceOfTruth": "private manifest asset ids only",
    "rawMediaPathsRejected": true,
    "signedUrlsRejectedAsSourceOfTruth": true,
    "providerOutputBlobsRejected": true
  },
  "readBoundary": {
    "mediaFileOpenApprovedToday": false,
    "audioreadOpenApprovedToday": false,
    "pydubMediaOperationApprovedToday": false,
    "ffmpegFfprobeApprovedToday": false,
    "workerRuntimeMediaReadApprovedToday": false,
    "ownerGateRequired": "SOUND_RUNTIME_MEDIA_GATE"
  }
}
```

The private media read boundary is a future contract only. Phase 74 does not open media files or approve runtime media reads.
