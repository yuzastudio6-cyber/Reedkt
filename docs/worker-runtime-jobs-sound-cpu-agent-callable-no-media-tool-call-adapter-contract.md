# WORKER_RUNTIME_JOBS SOUND CPU Agent-Callable No-Media Tool-Call Adapter Contract

```json worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-contract
{
  "label": "worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter-contract",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_agent_callable_no_media_tool_call_adapter_completed_with_warnings_ready_for_external_agent_integration_review",
  "acceptedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
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
  "requestContract": {
    "requestKind": "sound_cpu_agent_callable_no_media_tool_call",
    "adapterMode": "bounded_no_real_media_external_agent_local",
    "inputMode": "json_file_or_stdin",
    "requiredFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "workerName",
      "imageName",
      "jobType",
      "syntheticOrNoMediaInput",
      "realExternalAgentUsed",
      "realUserMediaUsed",
      "runtimeFlags",
      "toolDescriptors"
    ],
    "toolDescriptorCount": 15,
    "runtimeFlagsMustAllBeFalse": true
  },
  "failClosedPolicy": {
    "forbiddenPayloadFields": [
      "rawPrompt",
      "mediaFilePath",
      "sourceMediaUrl",
      "signedUrl",
      "publicArtifactUrl",
      "artifactWriteTarget",
      "providerOutputBlob",
      "serviceRolePayload",
      "supabaseWriteIntent",
      "sqlStatement",
      "modelWeightLocation",
      "gcpResourceTarget",
      "dockerRunRequest",
      "betaUserExecutionRequest",
      "realExternalAgentRequest",
      "realUserMediaManifest",
      "manifestPersistenceRequest",
      "workerDispatchRequest",
      "routeExecutionRequest"
    ],
    "blockedIfAnyRuntimeFlagTrue": true,
    "blockedIfAnyToolMissing": true,
    "blockedIfAnyMediaOrArtifactFieldPresent": true
  }
}
```

External agents may use this contract only for bounded no-real-media local validation. A later owner gate is still required before wiring it into a real agent runtime or product route.
