# WORKER_RUNTIME_JOBS SOUND CPU Phase 111 Limited External-Agent Tool Coverage Register

```json worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-tool-coverage-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-tool-coverage-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase111_limited_external_agent_execution_proof_passed_with_warnings_ready_for_limited_external_agent_execution_proof_owner_review_no_real_user_media",
  "soundCpuToolSet": {
    "directPinnedPackages": [
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
      "mir_eval"
    ],
    "aliasCoveredTools": [
      "pydub_effects",
      "ebu_r128_pyloudnorm"
    ],
    "totalToolsInLane": 15,
    "packageImportProofComplete": true,
    "syntheticToolCallProofComplete": true,
    "controlledExternalAgentProofComplete": true,
    "limitedExternalAgentProofComplete": true,
    "readyForRealExecutionToday": 0
  },
  "allowedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "allowedJobTypesExercised": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ]
}
```

The proof exercised every accepted job type while covering the 15-tool SOUND CPU lane.
