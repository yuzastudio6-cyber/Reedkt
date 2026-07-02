# WORKER_RUNTIME_JOBS SOUND CPU Phase 114 Limited Product Tool-Call Tool Coverage Register

```json worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-tool-coverage-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-tool-coverage-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase114_limited_product_tool_call_execution_proof_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_owner_review_no_real_user_media",
  "soundCpuToolSet": {
    "totalToolsInLane": 15,
    "limitedProductToolCallBoundaryProofComplete": true,
    "readyForLimitedProductToolCallExecutionProofOwnerReview": 15,
    "readyForProductToolCallExecutionToday": 0,
    "readyForRealExecutionToday": 0
  },
  "toolIds": [
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
  "allowedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "allowedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "allowedJobTypesExercised": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ]
}
```

The proof covers the 15-tool SOUND CPU set at the synthetic descriptor boundary.
