# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Controlled Tool Execution Unlock Operation Plan

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-operation-plan
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-unlock-operation-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_unlock_plan_completed_with_warnings_ready_for_controlled_tool_execution_source_gate",
  "plannedOperationsForSourceGate": [
    {
      "jobType": "sound.package_import_smoke",
      "allowedInput": "no_media_import_or_metadata_only",
      "expectedToolCoverage": 15,
      "writesArtifacts": false
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "allowedInput": "synthetic_in_memory_numeric_arrays_only",
      "expectedTools": [
        "scipy",
        "resampy",
        "pyloudnorm",
        "audioflux",
        "noisereduce",
        "pedalboard",
        "mir_eval",
        "ebu_r128_pyloudnorm"
      ],
      "writesArtifacts": false
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "allowedInput": "synthetic_in_memory_symbolic_midi_only",
      "expectedTools": [
        "music21",
        "pretty_midi",
        "mido"
      ],
      "writesArtifacts": false
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "allowedInput": "synthetic_in_memory_signal_only",
      "expectedTools": [
        "pyloudnorm",
        "scipy"
      ],
      "writesArtifacts": false
    }
  ],
  "sourceGateRequirement": {
    "mustKeepRouteFailClosedUntilProof": true,
    "mustAddControlledExecutionFlagOrEquivalent": true,
    "mustAddProofRunnerBeforeClaimingExecutionReady": true,
    "mustProveAll15ToolsOrRecordExactPartialCoverage": true
  }
}
```

The first execution source gate should be synthetic and memory-only. Real media remains out of scope.
