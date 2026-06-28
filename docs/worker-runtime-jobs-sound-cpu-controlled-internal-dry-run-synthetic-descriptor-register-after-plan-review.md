# WORKER_RUNTIME_JOBS SOUND CPU Controlled Internal Dry Run Synthetic Descriptor Register After Plan Review

```json worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-synthetic-descriptor-register-after-plan-review
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-synthetic-descriptor-register-after-plan-review",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_internal_dry_run_execution_after_plan_review_completed_with_warnings_ready_for_dry_run_execution_owner_review_no_external_beta",
  "acceptedToolIds": [
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
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "syntheticPayloadKinds": [
    "empty_in_memory_signal_descriptor",
    "small_numeric_array_descriptor",
    "symbolic_midi_descriptor_without_file_io",
    "loudness_metadata_descriptor_without_audio_open"
  ],
  "descriptorCounts": {
    "total": 15,
    "passed": 15,
    "failed": 0,
    "skipped": 0
  },
  "descriptorDigest": "278afb2895eeebdbb433b858fa6df87e966d2dcf4d21826380e11956121ce81a",
  "runtimeFlagsRequiredFalse": [
    "openMediaFile",
    "processMedia",
    "writeArtifact",
    "callProvider",
    "executeWorker",
    "executeRoute",
    "touchSupabase",
    "runSql",
    "createSignedUrl",
    "enableExternalBeta"
  ]
}
```

The descriptors prove only the synthetic no-media/no-artifact boundary for the accepted SOUND CPU planning set.
