# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Disabled Route Source Contract Plan

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-contract-plan
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-contract-plan",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_creation_plan_completed_with_warnings_ready_for_disabled_route_source_owner_review",
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
  "futureRequestEnvelope": {
    "requiredFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "workerName",
      "imageName",
      "jobType",
      "attemptMetadata",
      "staticOnlyRuntimeFlags"
    ],
    "forbiddenFields": [
      "rawPrompt",
      "agentSecret",
      "mediaFilePath",
      "signedUrl",
      "publicArtifactUrl",
      "serviceRolePayload",
      "providerOutputBlob",
      "modelWeightPath",
      "artifactWriteTarget"
    ],
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
    ]
  },
  "futureResultEnvelope": {
    "stdoutJsonOnly": true,
    "persistsResult": false,
    "writesArtifact": false,
    "opensMedia": false,
    "dispatchesWorker": false,
    "executesRoute": false,
    "callsProviderOrModel": false,
    "mutatesSupabase": false
  }
}
```

The future source contract must represent only no-media external-agent descriptors and fail closed for any unsafe runtime envelope.
