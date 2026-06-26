# WORKER_RUNTIME_JOBS SOUND CPU No-Media No-Artifact Package Proof Register

```json worker-runtime-jobs-sound-cpu-no-media-no-artifact-package-proof-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_music21_import_timeout_fix_passed_with_warnings_ready_for_package_proof_owner_review",
  "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "directPinnedPackages": [
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
  ],
  "aliasCoveredTools": [
    "pydub_effects",
    "ebu_r128_pyloudnorm"
  ],
  "metadata": {
    "passed": true,
    "passedCount": 13,
    "failedCount": 0
  },
  "moduleImports": [
    { "module": "librosa", "passed": true, "durationSeconds": 0.03 },
    { "module": "audioread", "passed": true, "durationSeconds": 0.035 },
    { "module": "pydub", "passed": true, "durationSeconds": 0.139 },
    { "module": "scipy", "passed": true, "durationSeconds": 0.45 },
    { "module": "scipy.signal", "passed": true, "durationSeconds": 9.715 },
    { "module": "resampy", "passed": true, "durationSeconds": 3.251 },
    { "module": "pyloudnorm", "passed": true, "durationSeconds": 0.67 },
    { "module": "audioflux", "passed": true, "durationSeconds": 10.22, "warning": "Matplotlib font cache build warning only" },
    { "module": "music21", "passed": true, "durationSeconds": 1.194 },
    { "module": "pretty_midi", "passed": true, "durationSeconds": 0.09 },
    { "module": "mido", "passed": true, "durationSeconds": 0.055 },
    { "module": "noisereduce", "passed": true, "durationSeconds": 0.749 },
    { "module": "pedalboard", "passed": true, "durationSeconds": 0.699 },
    { "module": "mir_eval", "passed": true, "durationSeconds": 3.533 }
  ],
  "syntheticAssertions": [
    { "name": "scipy_in_memory_numeric_array_assertion", "passed": true, "durationSeconds": 0.529 },
    { "name": "pyloudnorm_in_memory_loudness_shape_assertion", "passed": true, "durationSeconds": 0.512 },
    { "name": "music21_in_memory_symbolic_note_assertion", "passed": true, "durationSeconds": 0.193 },
    { "name": "pretty_midi_in_memory_object_assertion", "passed": true, "durationSeconds": 0.074 },
    { "name": "mido_in_memory_message_assertion", "passed": true, "durationSeconds": 0.047 }
  ],
  "proofBoundaries": {
    "mediaFileOpenAttempted": false,
    "audioreadAudioOpenAttempted": false,
    "pydubMediaOperationAttempted": false,
    "ffmpegExecuted": false,
    "ffprobeExecuted": false,
    "workerExecutionAttempted": false,
    "routeExecutionAttempted": false,
    "toolRuntimeDispatchAttempted": false,
    "providerCallAttempted": false,
    "modelDownloadAttempted": false,
    "supabaseMutationAttempted": false,
    "sqlExecutionAttempted": false,
    "artifactCreationAttempted": false,
    "dockerCloudRunAttempted": false
  }
}
```
