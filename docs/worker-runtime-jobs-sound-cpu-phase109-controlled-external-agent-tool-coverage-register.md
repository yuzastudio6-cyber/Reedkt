# WORKER_RUNTIME_JOBS SOUND CPU Phase 109 Controlled External-Agent Tool Coverage Register

```json worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-tool-coverage-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-tool-coverage-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase109_controlled_external_agent_execution_proof_passed_with_warnings_ready_for_external_agent_execution_proof_owner_review_no_runtime_side_effects",
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
    "dockerBuildProofComplete": true,
    "controlledExternalAgentProofComplete": true,
    "readyForRealExecutionToday": 0
  },
  "allowedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "allowedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ]
}
```

The proof covers the 15-tool SOUND CPU lane as a synthetic boundary only.
