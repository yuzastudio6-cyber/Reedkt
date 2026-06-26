# WORKER_RUNTIME_JOBS SOUND CPU Controlled Runtime Beta Preflight Readiness Register

```json worker-runtime-jobs-sound-cpu-controlled-runtime-beta-preflight-readiness-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_runtime_beta_preflight_passed_with_warnings_ready_for_runtime_execution_approval_gate",
  "soundCpuCandidates": {
    "candidateCount": 15,
    "directPinnedPackages": [
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
      "mir_eval"
    ],
    "aliasCoveredTools": [
      {
        "toolId": "pydub_effects",
        "coveredByPackage": "pydub"
      },
      {
        "toolId": "ebu_r128_pyloudnorm",
        "coveredByPackage": "pyloudnorm"
      }
    ],
    "signalsmithStretch": "planning_only_not_runtime_enabled"
  },
  "productionReadinessSummary": {
    "overallStatus": "blocked",
    "workers": 6,
    "tools": 49,
    "images": 6,
    "missingTools": 10,
    "notInstalledTools": 17,
    "futureOnlyTools": 7,
    "evaluationOnlyTools": 3,
    "needsLicenseReviewTools": 2,
    "needsModelWeightReviewTools": 10,
    "hardBlockers": 101,
    "warnings": 26
  },
  "betaReadinessSummary": {
    "status": "internal_testing_ready",
    "internalDryRunAllowed": true,
    "externalBetaAllowed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "scenarios": 9
  },
  "preflightBoundaries": {
    "acceptedForDependencyBackedStaticPreflight": true,
    "acceptedForInternalPlanningEvidence": true,
    "acceptedForRuntimeExecutionToday": false,
    "acceptedForWorkerDispatchToday": false,
    "acceptedForRouteExecutionToday": false,
    "acceptedForToolExecutionToday": false,
    "acceptedForMediaProcessingToday": false,
    "acceptedForExternalBetaToday": false,
    "acceptedForProductionToday": false
  }
}
```
