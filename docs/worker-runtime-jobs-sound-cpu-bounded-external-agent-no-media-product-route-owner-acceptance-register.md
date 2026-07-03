# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Product Route Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-owner-acceptance-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_owner_review_passed_with_warnings_ready_for_disabled_route_source_creation_plan",
  "acceptedForFuturePlanning": {
    "disabledRouteSourceCreationPlan": true,
    "internalPostRouteShape": true,
    "stdoutJsonOnlyResult": true,
    "featureFlagDisabledDefault": true,
    "unsafeEnvelopeFailClosedCases": true
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
  "acceptedForToday": {
    "actualRouteSourceCreation": false,
    "routeRegistration": false,
    "routeExecution": false,
    "workerDispatch": false,
    "jobClaimLeaseMutation": false,
    "realExternalAgentCredentialProvisioning": false,
    "realUserMediaRead": false,
    "mediaProcessing": false,
    "artifactCreation": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "externalBetaRuntime": false
  }
}
```

The owner acceptance is limited to future planning for a disabled internal route source-creation gate.
