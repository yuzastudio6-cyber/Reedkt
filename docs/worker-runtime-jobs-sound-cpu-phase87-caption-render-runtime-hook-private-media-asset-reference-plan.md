# WORKER_RUNTIME_JOBS SOUND CPU Phase 87 Private Media Asset Reference Plan

```json worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-media-asset-reference-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase87-caption-render-runtime-hook-private-media-asset-reference-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "privateMediaAssetReferencePolicy": {
    "referencesAreOpaqueIds": true,
    "referencesRequireApprovedPlanSnapshot": true,
    "referencesRequireWorkspaceProjectJobScope": true,
    "referencesMustNotBeLocalFilePaths": true,
    "referencesMustNotBeSignedUrls": true,
    "referencesMustNotBePublicUrls": true,
    "referencesMustNotContainSecrets": true,
    "mediaOpenRequiresFutureOwnerGate": true
  },
  "executionState": {
    "resolvePrivateMediaReferenceToday": false,
    "openMediaFileToday": false,
    "ffmpegFfprobeExecutedToday": false,
    "mediaProcessingEnabledToday": false
  }
}
```

Private media references are planned as opaque IDs only. No media reference is resolved or opened in this gate.
