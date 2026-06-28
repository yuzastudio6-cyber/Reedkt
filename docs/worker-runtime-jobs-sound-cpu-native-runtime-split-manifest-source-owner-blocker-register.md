# WORKER_RUNTIME_JOBS SOUND CPU Native Runtime Split Manifest Source Owner Blocker Register

```json worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-blocker-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_owner_review_passed_with_warnings_ready_for_isolated_install_import_proof_plan_no_install_no_media_no_production",
  "remainingBlockers": [
    {
      "id": "isolated_install_import_proof_not_yet_planned_or_run",
      "status": "open",
      "blocks": [
        "pyav_source_install_closure",
        "opencv_source_install_closure",
        "pyscenedetect_source_install_closure"
      ]
    },
    {
      "id": "native_ffmpeg_dylib_duplicate_warning",
      "status": "mitigation_source_created_but_unproven",
      "blocks": [
        "real_user_media_beta",
        "paid_production"
      ]
    }
  ],
  "closureToday": {
    "sourceInstallReviewClosedCountThisGate": 0,
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
  }
}
```

The next unblocker is a proof plan, then a controlled isolated proof.
