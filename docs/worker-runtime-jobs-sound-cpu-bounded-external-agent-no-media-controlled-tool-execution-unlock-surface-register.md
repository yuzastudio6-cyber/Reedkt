# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Controlled Tool Execution Unlock Surface Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-surface-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-surface-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_unlock_plan_completed_with_warnings_ready_for_controlled_tool_execution_source_gate",
  "acceptedSurfaceForSourceGate": {
    "routePath": "/api/internal/workers/sound-cpu/no-media-agent-call",
    "adapterReference": "scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs",
    "harnessReference": "scripts/validation/worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-proof-runner.mjs",
    "executionMode": "bounded_synthetic_no_media_only",
    "requiresExplicitToolId": true,
    "requiresAllRuntimeFlagsFalseByDefault": true,
    "requiresFailClosedInvalidEnvelope": true,
    "requiresNoRealCredentials": true,
    "requiresNoRealUserMedia": true
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
  "acceptedNoMediaJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ]
}
```

The source gate must reuse the existing no-media adapter/harness semantics and the registered route path, rather than creating a duplicate external-agent lane.
