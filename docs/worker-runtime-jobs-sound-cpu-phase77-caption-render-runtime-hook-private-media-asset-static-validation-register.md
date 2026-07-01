# WORKER_RUNTIME_JOBS SOUND CPU Phase 77 Private Media Asset Static Validation Register

```json worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-private-media-asset-static-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase77-caption-render-runtime-hook-private-media-asset-static-validation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDoc": "docs/worker-runtime-jobs-sound-cpu-phase76-caption-render-runtime-hook-private-media-asset-example-register.md",
  "validatedPrivateMediaAssetIds": [
    "private-media-asset:sound-cpu:caption-render:fixture-audio-001",
    "private-media-asset:sound-cpu:caption-render:fixture-audio-002",
    "private-media-asset:sound-cpu:caption-render:fixture-audio-003"
  ],
  "validationChecks": {
    "allIdsUsePrivateMediaAssetPrefix": true,
    "allIdsAreUnique": true,
    "noFilesystemPath": true,
    "noHttpUrl": true,
    "noSignedUrl": true,
    "noPublicArtifactUrl": true,
    "noProviderBlob": true
  },
  "executionState": {
    "realMediaBytesUsedToday": false,
    "mediaFileOpenedToday": false,
    "storageObjectReadToday": false,
    "signedUrlCreatedToday": false
  }
}
```

The private media asset examples pass static validation as opaque IDs only.
