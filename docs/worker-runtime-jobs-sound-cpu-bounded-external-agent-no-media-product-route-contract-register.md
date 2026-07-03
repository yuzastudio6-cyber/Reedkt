# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Product Route Contract Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-contract-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_plan_completed_with_warnings_ready_for_product_route_owner_review",
  "proposedRoute": {
    "path": "/api/internal/workers/sound-cpu/no-media-agent-call",
    "method": "POST",
    "createdToday": false,
    "publicApi": false,
    "internalPlanningOnly": true,
    "disabledByDefault": true
  },
  "requiredRequestFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "agentOrigin",
    "agentSessionId",
    "workerName",
    "imageName",
    "jobType",
    "toolDescriptors",
    "runtimeFlags"
  ],
  "forbiddenRequestFields": [
    "rawPrompt",
    "agentSecret",
    "providerCredential",
    "supabaseServiceRoleKey",
    "mediaFilePath",
    "signedUrl",
    "publicArtifactUrl",
    "storageWriteTarget",
    "modelWeightPath",
    "serviceAccountJson"
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
  "resultShape": {
    "stdoutJsonOnly": true,
    "includesDecision": true,
    "includesAcceptedToolCount": true,
    "includesAcceptedJobType": true,
    "includesSideEffectsFalseMap": true,
    "persistsResult": false
  }
}
```

The route contract is a planning artifact only. It records the exact allowlists and payload boundaries that a later source-creation gate must preserve.
