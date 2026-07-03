# WORKER_RUNTIME_JOBS SOUND CPU Real External-Agent No-Media Harness Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-owner-acceptance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_owner_review_passed_with_warnings_ready_for_bounded_execution_surface_plan",
  "acceptedForNextPlanning": {
    "credentiallessExternalAgentNoMediaHarness": true,
    "boundedExecutionSurfacePlan": true,
    "stdoutJsonOnly": true,
    "adapterForwarding": true,
    "failClosedPolicy": true
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
    "externalBetaRuntimeUnlock": false,
    "productionUnlock": false
  }
}
```

The owner acceptance is intentionally scoped to planning the bounded surface. The harness remains local, credentialless, and no-media.
