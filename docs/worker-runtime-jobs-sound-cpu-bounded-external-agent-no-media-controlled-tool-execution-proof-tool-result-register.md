# WORKER_RUNTIME_JOBS SOUND CPU Controlled Tool Execution Proof Tool Result Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-tool-result-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-proof-tool-result-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_passed_with_warnings_ready_for_tool_execution_owner_review",
  "tools": [
    { "toolId": "librosa", "version": "0.11.0", "passed": true, "operation": "rms_on_in_memory_zero_array" },
    { "toolId": "audioread", "version": "3.1.0", "passed": true, "operation": "metadata_import_only_no_audio_open" },
    { "toolId": "pydub", "version": "0.25.1", "passed": true, "operation": "silent_segment_in_memory_only" },
    { "toolId": "scipy", "version": "1.17.1", "passed": true, "operation": "signal_peak_detection_on_in_memory_array" },
    { "toolId": "resampy", "version": "0.4.3", "passed": true, "operation": "resample_in_memory_zero_array" },
    { "toolId": "pyloudnorm", "version": "0.2.0", "passed": true, "operation": "loudness_meter_on_one_second_in_memory_silence" },
    { "toolId": "audioflux", "version": "0.1.9", "passed": true, "operation": "import_and_version_surface_only" },
    { "toolId": "music21", "version": "10.3.0", "passed": true, "operation": "in_memory_note_construction" },
    { "toolId": "pretty_midi", "version": "0.2.11", "passed": true, "operation": "in_memory_midi_object_construction_no_write" },
    { "toolId": "mido", "version": "1.3.3", "passed": true, "operation": "in_memory_message_construction_no_port" },
    { "toolId": "noisereduce", "version": "3.0.3", "passed": true, "operation": "noise_reduction_on_in_memory_zero_array" },
    { "toolId": "pedalboard", "version": "0.9.23", "passed": true, "operation": "gain_board_on_in_memory_array" },
    { "toolId": "mir_eval", "version": "0.8.2", "passed": true, "operation": "onset_metric_on_in_memory_arrays" },
    { "toolId": "pydub_effects", "version": "0.25.1", "passed": true, "operation": "gain_and_fade_on_silent_segment_in_memory_only" },
    { "toolId": "ebu_r128_pyloudnorm", "version": "0.2.0", "passed": true, "operation": "ebu_style_loudness_meter_on_one_second_in_memory_silence" }
  ],
  "coverage": {
    "attemptedToolCount": 15,
    "passedToolCount": 15,
    "failedToolCount": 0,
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2
  }
}
```
