# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Disabled Route Registration Source Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-registration-source-owner-acceptance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_controlled_disabled_route_call_proof_plan",
  "acceptedForNextGateOnly": {
    "routePath": "/api/internal/workers/sound-cpu/no-media-agent-call",
    "httpMethod": "POST",
    "routeFactory": "createSoundCpuNoMediaAgentCallRoutes",
    "disabledHandler": "soundCpuNoMediaAgentCallDisabledRouteHandler",
    "blockedStatusCode": 409,
    "explicitToolIdRequired": true,
    "registeredAsDisabledHandlerOnly": true,
    "controlledDisabledRouteCallProofMayProceed": true
  },
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
  "acceptedForExecutionToday": {
    "routeExecution": false,
    "workerDispatch": false,
    "workerExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactWrite": false,
    "providerModelCall": false,
    "dockerCloudRunExecution": false,
    "externalBetaRuntime": false,
    "productionRuntime": false
  }
}
```

The accepted surface remains the 15 CPU/no-media tools plus the two worker and image names, but acceptance is limited to proving the disabled endpoint can be reached safely.
