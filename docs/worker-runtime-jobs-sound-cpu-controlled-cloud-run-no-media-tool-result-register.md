# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Tool Result Register

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-tool-result-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-tool-result-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_execution_readback_passed_with_warnings_ready_for_agent_cloud_tool_call_proof",
  "toolCounts": {
    "attempted": 15,
    "passed": 15,
    "failed": 0,
    "directPinnedPackages": 13,
    "aliasCoveredTools": 2
  },
  "tools": [
    { "toolId": "librosa", "package": "librosa", "module": "librosa", "version": "0.11.0", "passed": true, "operation": "synthetic_rms_shape_1x5" },
    { "toolId": "audioread", "package": "audioread", "module": "audioread", "version": "3.1.0", "passed": true, "operation": "module_loaded_without_audio_open" },
    { "toolId": "pydub", "package": "pydub", "module": "pydub", "version": "0.25.1", "passed": true, "operation": "synthetic_silent_segment_10ms" },
    { "toolId": "scipy", "package": "scipy", "module": "scipy", "version": "1.17.1", "passed": true, "operation": "synthetic_peak_count_2" },
    { "toolId": "resampy", "package": "resampy", "module": "resampy", "version": "0.4.3", "passed": true, "operation": "synthetic_resample_output_length_50" },
    { "toolId": "pyloudnorm", "package": "pyloudnorm", "module": "pyloudnorm", "version": "0.2.0", "passed": true, "operation": "synthetic_loudness_finite_or_silent" },
    { "toolId": "audioflux", "package": "audioflux", "module": "audioflux", "version": "0.1.9", "passed": true, "operation": "module_loaded" },
    { "toolId": "music21", "package": "music21", "module": "music21", "version": "10.3.0", "passed": true, "operation": "synthetic_note_c4" },
    { "toolId": "pretty_midi", "package": "pretty_midi", "module": "pretty_midi", "version": "0.2.11", "passed": true, "operation": "synthetic_one_instrument_one_note" },
    { "toolId": "mido", "package": "mido", "module": "mido", "version": "1.3.3", "passed": true, "operation": "synthetic_note_on_60" },
    { "toolId": "noisereduce", "package": "noisereduce", "module": "noisereduce", "version": "3.0.3", "passed": true, "operation": "synthetic_output_length_1024" },
    { "toolId": "pedalboard", "package": "pedalboard", "module": "pedalboard", "version": "0.9.23", "passed": true, "operation": "synthetic_output_shape_1x1024" },
    { "toolId": "mir_eval", "package": "mir_eval", "module": "mir_eval", "version": "0.8.2", "passed": true, "operation": "synthetic_score_count_3" },
    { "toolId": "pydub_effects", "package": "pydub", "module": "pydub", "version": "0.25.1", "passed": true, "operation": "alias_covered_by_pydub_synthetic_silent_segment" },
    { "toolId": "ebu_r128_pyloudnorm", "package": "pyloudnorm", "module": "pyloudnorm", "version": "0.2.0", "passed": true, "operation": "alias_covered_by_pyloudnorm_synthetic_loudness" }
  ]
}
```

Every operation used synthetic in-memory data or module metadata. No real user media path, public URL, signed URL, storage object, or provider output was used as input.
