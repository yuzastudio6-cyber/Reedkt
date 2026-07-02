# WORKER_RUNTIME_JOBS SOUND CPU Phase 128 Limited External-Agent Product Tool-Call Execution Invocation Register No Real User Media

```json worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-invocation-register-no-real-user-media
{
  "label": "worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-invocation-register-no-real-user-media",
  "decision": "worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_no_real_user_media_passed_with_warnings_ready_for_execution_owner_review_no_real_user_media",
  "controlledInvocationCount": 4,
  "expectedToolDescriptorCountPerInvocation": 15,
  "workers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "images": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "jobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
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
  "inputKind": "synthetic_no_real_user_media",
  "externalAgentAdapterMode": "limited_synthetic_no_real_agent",
  "runtimeFlagsAllFalse": true
}
```

The proof covered all 15 accepted SOUND CPU tools through four synthetic product tool-call boundary invocations.
