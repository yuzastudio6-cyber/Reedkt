# WORKER_RUNTIME_JOBS SOUND CPU Controlled Tool Execution Tool Operation Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-tool-operation-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-tool-operation-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_source_gate_completed_with_warnings_ready_for_controlled_tool_execution_proof",
  "tools": [
    { "toolId": "librosa", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "rms_on_in_memory_zero_array" },
    { "toolId": "audioread", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "metadata_import_only_no_audio_open" },
    { "toolId": "pydub", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "silent_segment_in_memory_only" },
    { "toolId": "scipy", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "signal_peak_detection_on_in_memory_array" },
    { "toolId": "resampy", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "resample_in_memory_zero_array" },
    { "toolId": "pyloudnorm", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "loudness_meter_on_in_memory_silence" },
    { "toolId": "audioflux", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "import_and_version_surface_only_until_api_safe_operation_is_proved" },
    { "toolId": "music21", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "in_memory_note_construction" },
    { "toolId": "pretty_midi", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "in_memory_midi_object_construction_no_write" },
    { "toolId": "mido", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "in_memory_message_construction_no_port" },
    { "toolId": "noisereduce", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "noise_reduction_on_in_memory_zero_array" },
    { "toolId": "pedalboard", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "gain_board_on_in_memory_array" },
    { "toolId": "mir_eval", "coverage": "direct_pinned_package", "plannedSyntheticOperation": "onset_metric_on_in_memory_arrays" },
    { "toolId": "pydub_effects", "coverage": "alias_covered_by_pydub", "plannedSyntheticOperation": "gain_and_fade_on_silent_segment_in_memory_only" },
    { "toolId": "ebu_r128_pyloudnorm", "coverage": "alias_covered_by_pyloudnorm", "plannedSyntheticOperation": "ebu_style_loudness_meter_on_in_memory_silence" }
  ],
  "proofRequirement": {
    "mustAttemptAll15Tools": true,
    "mustRecordExactPassFailPerTool": true,
    "mustRecordSanitizedErrors": true,
    "mustNotUseRealMedia": true,
    "mustNotWriteArtifacts": true
  }
}
```
