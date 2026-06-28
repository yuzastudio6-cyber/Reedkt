# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Plan

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production",
  "sourceBase": {
    "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "sourceHead": "f1c6154461af1eb96e11082354074fed46618d39",
    "nativeImportProofPr": 1473,
    "nativeImportProofDecision": "worker_runtime_jobs_sound_cpu_controlled_native_runtime_install_import_proof_blocked_native_ffmpeg_dylib_duplicate_warning_ready_for_split_manifest_plan_no_media_no_production"
  },
  "planResult": {
    "duplicateBlockerId": "native_ffmpeg_dylib_duplicate_warning",
    "splitManifestPlanCreated": true,
    "requirementsFilesChangedToday": false,
    "runtimeSourceChangedToday": false,
    "sourceInstallReviewClosedCountThisGate": 0,
    "sourceInstallReviewStillRequired": [
      "pyav",
      "pyscenedetect",
      "opencv"
    ],
    "nodeNativeRuntimeSourceInstallStillRequired": [
      "sharp",
      "remotion"
    ],
    "boundedExternalBetaAllowedNoRuntimeNoRealMedia": true,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-PLAN: create isolated PyAV/OpenCV/PySceneDetect manifests, no media/no production"
}
```

This packet plans the duplicate-native-runtime fix. It does not alter requirements files or claim runtime readiness.
