# WORKER_RUNTIME_JOBS SOUND CPU Current Tool Readiness Count Register

```json worker-runtime-jobs-sound-cpu-current-tool-readiness-count-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_current_lane_status_review_completed_with_warnings_ready_for_runtime_beta_readiness_decision_review",
  "toolCounts": {
    "candidateToolCount": 15,
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2,
    "packageProofReadyForPlanningCount": 15,
    "packageProofReadyForPlanningTools": [
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
    "persistentRuntimeInstallReadyCount": 0,
    "persistentRuntimeInstallReadyTools": [],
    "toolCallExecutionReadyCount": 0,
    "toolCallExecutionReadyTools": [],
    "notYetRuntimeInstalledOrCallableCount": 15
  },
  "interpretation": {
    "packageProofMeaning": "These tools installed, imported, and passed bounded in-memory synthetic assertions in disposable proof scope only.",
    "runtimeMeaning": "No persistent worker image/runtime, route, tool dispatch, media path, artifact path, Supabase path, beta path, or production path is authorized by this evidence.",
    "doNotCallTheseToolsYet": true
  }
}
```
