# WORKER_RUNTIME_JOBS SOUND CPU Phase 144 Dispatch Source Readiness Map

```json worker-runtime-jobs-sound-cpu-phase144-dispatch-source-readiness-map
{
  "label": "worker-runtime-jobs-sound-cpu-phase144-dispatch-source-readiness-map",
  "acceptedPlanningInputs": {
    "workers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "images": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "routePath": "/api/workers/sound-cpu",
    "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
    "requirementsSource": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt"
  },
  "requiredDispatchContractFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "attempt",
    "privateManifestRef",
    "runtimeFlags"
  ],
  "blockedPayloadSources": [
    "rawPrompt",
    "signedUrlAsSourceOfTruth",
    "publicArtifactUrl",
    "realUserMediaFilePath",
    "providerOutputBlob",
    "serviceRolePayload",
    "modelWeightLocation",
    "artifactWriteTarget"
  ],
  "sourcePlanReady": true,
  "sourceCreationReady": false,
  "executionReady": false
}
```

Dispatch source planning must stay contract-first and approved-snapshot-bound.
