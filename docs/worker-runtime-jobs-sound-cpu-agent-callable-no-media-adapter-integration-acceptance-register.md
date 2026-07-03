# WORKER_RUNTIME_JOBS SOUND CPU Agent-Callable No-Media Adapter Integration Acceptance Register

```json worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-agent-callable-no-media-adapter-integration-acceptance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_agent_callable_no_media_adapter_integration_review_passed_with_warnings_ready_for_real_external_agent_no_media_integration_plan",
  "acceptedForNextPlanning": {
    "boundedNoMediaJsonAdapter": true,
    "jsonFileInput": true,
    "stdinJsonInput": true,
    "stdoutJsonOutput": true,
    "failClosedUnsafeRequestPolicy": true,
    "realExternalAgentNoMediaIntegrationPlan": true
  },
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
  "acceptedForToday": {
    "realExternalAgentCredentials": false,
    "realExternalAgentRuntimeExecution": false,
    "realUserMedia": false,
    "workerDispatch": false,
    "routeExecution": false,
    "manifestPersistence": false,
    "artifactWrite": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "betaUnlock": false,
    "productionUnlock": false
  }
}
```

The adapter may be used as a reviewed local entrypoint for the next integration plan. It remains bounded to synthetic or no-media envelopes until a later gate explicitly changes that boundary.
