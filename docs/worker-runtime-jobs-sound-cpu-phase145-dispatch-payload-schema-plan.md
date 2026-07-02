# WORKER_RUNTIME_JOBS SOUND CPU Phase 145 Dispatch Payload Schema Plan

```json worker-runtime-jobs-sound-cpu-phase145-dispatch-payload-schema-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase145-dispatch-payload-schema-plan",
  "requiredFields": [
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
  "allowedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "allowedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "allowedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "requiredRuntimeFlags": {
    "realUserMediaAllowed": false,
    "artifactWriteAllowed": false,
    "workerDispatchAllowed": false,
    "supabaseMutationAllowed": false,
    "routeExecutionAllowed": false
  },
  "blockedPayloadSources": [
    "rawPrompt",
    "signedUrlAsSourceOfTruth",
    "publicArtifactUrl",
    "realUserMediaFilePath",
    "providerOutputBlob",
    "serviceRolePayload",
    "modelWeightLocation",
    "artifactWriteTarget"
  ]
}
```

The planned schema remains static and deny-by-default.
