# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Readiness Recheck Tool Status Register

```json worker-runtime-jobs-sound-cpu-launch-core-readiness-recheck-tool-status-register-after-signalsmith
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_readiness_recheck_after_signalsmith_bounded_reconciliation_completed_with_warnings_ready_for_model_gpu_evaluation_blocker_routing_no_runtime",
  "sourceHead": "29602c9203d663768525585edd5d7b153a0db8e1",
  "productionToolRegistryCount": 49,
  "toolStatusCounts": {
    "warning": 14,
    "not_installed": 13,
    "future_only": 7,
    "evaluation_only": 3,
    "needs_license_review": 2,
    "needs_model_weight_review": 10,
    "missing": 0
  },
  "cpuInstallProofScope": {
    "directPinnedPackagesCount": 13,
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
      "pydub_effects",
      "ebu_r128_pyloudnorm"
    ],
    "approvedPlanCoveredPlanningOnlyTools": [
      "signalsmith_stretch"
    ],
    "readyForUnboundedToolCallExecutionToday": 0,
    "readyForRealUserMediaBetaToday": 0
  },
  "staticWarningEvidence": {
    "dockerfileSystemPackageWarnings": [
      "ffmpeg",
      "ffprobe",
      "libass"
    ],
    "dockerfilePipRequirementWarnings": [
      "audioflux"
    ],
    "boundedActivationEvidenceWarnings": [
      "signalsmith_stretch"
    ]
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "blockedClaims": {
    "toolExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "mediaProcessing": false,
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  }
}
```

The 13 direct pinned CPU packages plus two alias-covered tools have controlled install/import evidence from earlier gates. They are not automatically product tool-call execution readiness. This register keeps that distinction explicit while reporting the current 49-tool production-readiness status split.
