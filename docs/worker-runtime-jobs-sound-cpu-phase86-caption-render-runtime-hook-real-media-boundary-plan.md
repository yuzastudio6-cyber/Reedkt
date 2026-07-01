# WORKER_RUNTIME_JOBS SOUND CPU Phase 86 Real Media Boundary Plan

```json worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-boundary-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase86-caption-render-runtime-hook-real-media-boundary-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "acceptedFutureInputBoundary": {
    "requiresApprovedPlanSnapshotId": true,
    "requiresWorkspaceId": true,
    "requiresProjectId": true,
    "requiresPrivateMediaAssetId": true,
    "requiresJobId": true,
    "requiresIdempotencyKey": true,
    "requiresManifestReference": true,
    "rejectRawFilesystemPaths": true,
    "rejectSignedUrlsAsSourceOfTruth": true,
    "rejectPublicArtifactUrls": true,
    "rejectProviderOutputBlobs": true,
    "rejectSecrets": true
  },
  "executionState": {
    "useRealMediaBytesToday": false,
    "openMediaFileToday": false,
    "mediaFileOpenedToday": false,
    "ffmpegFfprobeExecutedToday": false
  }
}
```

Future real-media access must be private-manifest referenced and approved-snapshot bound; this planning gate does not open media.
