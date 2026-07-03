# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Execution Surface Proof Invocation Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-invocation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_passed_with_warnings_ready_for_surface_owner_review",
  "acceptedInvocations": [
    {
      "jobType": "sound.package_import_smoke",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "acceptedToolCount": 15,
      "status": "accepted",
      "stdoutJsonOnly": true
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "acceptedToolCount": 15,
      "status": "accepted",
      "stdoutJsonOnly": true
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "acceptedToolCount": 15,
      "status": "accepted",
      "stdoutJsonOnly": true
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "acceptedToolCount": 15,
      "status": "accepted",
      "stdoutJsonOnly": true
    }
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
  "aliasCoverage": {
    "pydub_effects": "covered_by_pydub",
    "ebu_r128_pyloudnorm": "covered_by_pyloudnorm"
  },
  "sideEffects": {
    "realExternalAgentCredentialsUsed": false,
    "realUserMediaUsed": false,
    "mediaOpened": false,
    "workerDispatched": false,
    "routeExecuted": false,
    "manifestPersisted": false,
    "providerCalled": false,
    "modelCalled": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "storageObjectCreated": false,
    "signedUrlCreated": false,
    "publicArtifactCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "outputWrittenToDisk": false,
    "tempArtifactsCreated": false
  }
}
```

Each accepted invocation uses the same 15-tool descriptor set and a different accepted job type. The proof does not create files or persist invocation artifacts.
