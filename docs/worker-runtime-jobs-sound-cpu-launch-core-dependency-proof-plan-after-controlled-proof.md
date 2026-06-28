# WORKER_RUNTIME_JOBS SOUND CPU Launch Core Dependency Proof Plan After Controlled Proof

```json worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-plan-after-controlled-proof
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-plan-after-controlled-proof",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production",
  "sourcePr": 1433,
  "sourceMergeCommit": "d1dfda8e6f416d26c2195be08e422d9178322063",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production",
  "nextControlledProofPlan": {
    "proofName": "controlled_launch_core_dependency_install_proof",
    "allowedActions": [
      "hydrate repo Node dependencies for validation only",
      "plan or perform controlled dependency install in an isolated proof branch when explicitly prompted",
      "rerun bounded command version checks",
      "rerun Python import checks",
      "rerun Node package metadata checks",
      "record sanitized pass/fail evidence"
    ],
    "forbiddenActions": [
      "media file open",
      "real-user media read",
      "image processing",
      "Remotion render",
      "worker execution",
      "route execution",
      "product tool-call execution",
      "Docker build/run/push",
      "GCP or Cloud Run",
      "Supabase mutation",
      "SQL execution",
      "artifact delivery",
      "provider/model call",
      "model download",
      "beta or production unlock"
    ],
    "requiredRerunChecks": [
      "ffmpeg_version",
      "ffprobe_version",
      "ffmpeg_libass_filter_inspection",
      "python_import_av",
      "python_import_scenedetect",
      "python_import_cv2",
      "python_import_duckdb",
      "python_import_polars",
      "python_import_opentimelineio",
      "node_package_metadata_sharp",
      "node_package_metadata_remotion"
    ],
    "deferredChecks": [
      "python_import_openimageio",
      "python_import_pyopencolorio",
      "node_package_metadata_hyperframe"
    ]
  },
  "proofPlanConclusion": {
    "nextProofShouldUseSameBoundedRunner": true,
    "nextProofShouldRemainStrictFalseUntilAllRequiredDepsPass": true,
    "realUserMediaBetaAllowedAfterThisPlan": false,
    "paidProductionAllowedAfterThisPlan": false,
    "runtimeReadinessClaimedAfterThisPlan": false
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

The proof plan keeps dependency checks separate from product runtime. Passing imports and metadata later is necessary evidence, not sufficient evidence for beta or production.
