# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Actual Disabled Route Source Contract Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-contract-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-source-contract-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_source_created_with_warnings_ready_for_source_owner_review",
  "sourceFile": "server/routes/sound-cpu-no-media-agent-call-routes.ts",
  "internalRoutePath": "/api/internal/workers/sound-cpu/no-media-agent-call",
  "acceptedTools": [
    "librosa",
    "audioread",
    "pydub",
    "scipy",
    "resampy",
    "pyloudnorm",
    "audioflux",
    "music21",
    "pretty_midi",
    "mido",
    "noisereduce",
    "pedalboard",
    "mir_eval",
    "pydub_effects",
    "ebu_r128_pyloudnorm"
  ],
  "acceptedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedNoMediaJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "requestEnvelope": {
    "requiredFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "workerName",
      "imageName",
      "jobType",
      "toolId",
      "attemptMetadata",
      "staticOnlyRuntimeFlags"
    ],
    "toolIdRequired": true,
    "runtimeFlagsRequiredFalse": [
      "routeExecutionEnabled",
      "workerDispatchExecutionEnabled",
      "workerExecutionEnabled",
      "mediaProcessingEnabled",
      "supabaseMutationEnabled",
      "sqlExecutionEnabled",
      "storageObjectCreationEnabled",
      "signedUrlCreationEnabled",
      "publicArtifactCreationEnabled",
      "providerModelCallEnabled",
      "dockerCloudRunExecutionEnabled"
    ],
    "forbiddenFieldsFailClosed": [
      "rawPrompt",
      "prompt",
      "agentSecret",
      "mediaFilePath",
      "mediaPath",
      "sourceMediaUrl",
      "signedUrl",
      "publicArtifactUrl",
      "serviceRolePayload",
      "providerOutputBlob",
      "modelWeightPath",
      "modelWeightLocation",
      "artifactWriteTarget",
      "supabaseWriteIntent",
      "sqlStatement",
      "gcpResourceTarget",
      "dockerRunRequest",
      "workerDispatchRequest",
      "routeExecutionRequest"
    ]
  },
  "resultEnvelope": {
    "stdoutJsonStyle": true,
    "acceptedForExecution": false,
    "routeRegisteredInApp": false,
    "routeExecutionEnabled": false,
    "ownerGateRequired": "WORKER_RUNTIME_JOBS",
    "persistsResult": false,
    "writesArtifact": false,
    "opensMedia": false,
    "dispatchesWorker": false,
    "callsProviderOrModel": false,
    "mutatesSupabase": false
  }
}
```

The source contract requires an explicit `toolId` so future external-agent calls can target one of the 15 accepted no-media tool capabilities, while all execution flags remain false.
