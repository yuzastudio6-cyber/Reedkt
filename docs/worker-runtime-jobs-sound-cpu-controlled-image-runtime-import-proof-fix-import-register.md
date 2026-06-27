# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Fix Import Register

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-import-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics",
  "metadataPackages": {
    "expectedCount": 13,
    "passedCount": 13,
    "failedCount": 0,
    "versions": {
      "audioflux": "0.1.9",
      "audioread": "3.1.0",
      "librosa": "0.11.0",
      "mido": "1.3.3",
      "mir_eval": "0.8.2",
      "music21": "10.3.0",
      "noisereduce": "3.0.3",
      "pedalboard": "0.9.23",
      "pretty_midi": "0.2.11",
      "pydub": "0.25.1",
      "pyloudnorm": "0.2.0",
      "resampy": "0.4.3",
      "scipy": "1.17.1"
    }
  },
  "importModules": {
    "expectedCount": 14,
    "passedCount": 12,
    "failedCount": 2,
    "failed": [
      {
        "module": "audioflux",
        "errorType": "OSError",
        "sanitizedMessageCaptured": false
      },
      {
        "module": "pedalboard",
        "errorType": "ImportError",
        "sanitizedMessageCaptured": false
      }
    ]
  },
  "aliasCoverage": {
    "pydub_effects": "pydub",
    "ebu_r128_pyloudnorm": "pyloudnorm"
  },
  "runtimeFlags": {
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
    "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0"
  }
}
```
