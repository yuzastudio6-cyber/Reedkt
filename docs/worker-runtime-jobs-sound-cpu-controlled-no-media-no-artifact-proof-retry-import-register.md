# WORKER_RUNTIME_JOBS SOUND CPU Controlled No-Media No-Artifact Proof Retry Import Register

```json worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-proof-retry-import-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_retry_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation",
  "moduleImports": [
    {"module": "librosa", "passed": true, "timedOut": false, "durationSeconds": 0.031},
    {"module": "audioread", "passed": true, "timedOut": false, "durationSeconds": 0.038},
    {"module": "pydub", "passed": true, "timedOut": false, "durationSeconds": 0.236},
    {"module": "scipy", "passed": true, "timedOut": false, "durationSeconds": 0.812},
    {"module": "scipy.signal", "passed": true, "timedOut": false, "durationSeconds": 22.598},
    {"module": "resampy", "passed": true, "timedOut": false, "durationSeconds": 3.286},
    {"module": "pyloudnorm", "passed": true, "timedOut": false, "durationSeconds": 0.581},
    {"module": "audioflux", "passed": true, "timedOut": false, "durationSeconds": 12.252, "warning": "Matplotlib font cache message only; no media execution"},
    {"module": "music21", "passed": true, "timedOut": false, "durationSeconds": 0.572},
    {"module": "pretty_midi", "passed": true, "timedOut": false, "durationSeconds": 0.081},
    {"module": "mido", "passed": true, "timedOut": false, "durationSeconds": 0.048},
    {"module": "noisereduce", "passed": true, "timedOut": false, "durationSeconds": 0.711},
    {"module": "pedalboard", "passed": true, "timedOut": false, "durationSeconds": 0.417},
    {"module": "mir_eval", "passed": true, "timedOut": false, "durationSeconds": 1.376}
  ],
  "counts": {
    "expectedImportCount": 14,
    "moduleImportsPassedCount": 14,
    "moduleImportsFailedCount": 0,
    "moduleImportsTimedOutCount": 0
  },
  "statisticsFallback": {
    "guardUsed": true,
    "guardedStatisticsPassed": true,
    "unguardedStatisticsTimedOut": false,
    "runtimeReadinessClaimed": false
  }
}
```
