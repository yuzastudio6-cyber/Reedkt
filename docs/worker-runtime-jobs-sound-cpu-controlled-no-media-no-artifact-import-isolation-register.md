# WORKER_RUNTIME_JOBS SOUND CPU Controlled No-Media No-Artifact Import Isolation Register

```json worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-import-isolation-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_fix_blocked_import_timeout",
  "metadataChecks": {
    "passed": true,
    "passedCount": 13,
    "failedCount": 0,
    "packages": [
      "librosa@0.11.0",
      "audioread@3.1.0",
      "pydub@0.25.1",
      "scipy@1.17.1",
      "resampy@0.4.3",
      "pyloudnorm@0.2.0",
      "audioflux@0.1.9",
      "music21@10.3.0",
      "pretty_midi@0.2.11",
      "mido@1.3.3",
      "noisereduce@3.0.3",
      "pedalboard@0.9.23",
      "mir_eval@0.8.2"
    ]
  },
  "moduleImports": [
    { "module": "librosa", "passed": true, "timedOut": false, "durationSeconds": 0.024 },
    { "module": "audioread", "passed": true, "timedOut": false, "durationSeconds": 0.027 },
    { "module": "pydub", "passed": true, "timedOut": false, "durationSeconds": 0.143 },
    { "module": "scipy", "passed": true, "timedOut": false, "durationSeconds": 0.485 },
    { "module": "scipy.signal", "passed": true, "timedOut": false, "durationSeconds": 9.935 },
    { "module": "resampy", "passed": true, "timedOut": false, "durationSeconds": 1.733 },
    { "module": "pyloudnorm", "passed": true, "timedOut": false, "durationSeconds": 0.611 },
    { "module": "audioflux", "passed": true, "timedOut": false, "durationSeconds": 1.917 },
    { "module": "music21", "passed": false, "timedOut": true, "durationSeconds": 45.008 }
  ],
  "notRunAfterBlocker": [
    "pretty_midi",
    "mido",
    "noisereduce",
    "pedalboard",
    "mir_eval",
    "scipy_in_memory_numeric_array_assertion",
    "pyloudnorm_in_memory_loudness_shape_assertion",
    "music21_in_memory_symbolic_note_assertion",
    "pretty_midi_in_memory_object_assertion",
    "mido_in_memory_message_assertion"
  ],
  "blockedReason": "music21 import exceeded the 45 second per-module timeout in the disposable proof venv"
}
```
