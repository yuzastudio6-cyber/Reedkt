# WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-PLAN-AFTER-PROOF-REVIEW

```json worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-plan-after-proof-review
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-PLAN-AFTER-PROOF-REVIEW",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_proof_owner_review_after_proof_passed_with_warnings_ready_for_persistent_manifest_plan_no_runtime_no_production",
  "requiredSourcePr": "the merged owner-review PR containing this prompt",
  "goal": "Plan persistent launch-core dependency manifests for the accepted Python and Node proof set without mutating manifests, lockfiles, runtime code, or production readiness.",
  "planningScope": {
    "pythonPackagesToPlan": ["av", "scenedetect", "opencv-python-headless", "duckdb", "polars", "opentimelineio"],
    "nodePackagesToPlan": ["sharp", "remotion"],
    "optionalDeferredPackages": ["OpenImageIO", "PyOpenColorIO", "hyperframe"],
    "ffmpegPolicyReviewStillRequired": true,
    "runtimeReadinessStillBlocked": true,
    "realUserMediaBetaStillBlocked": true,
    "paidProductionStillBlocked": true
  },
  "forbiddenScope": {
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "imageProcessing": false,
    "remotionRendering": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "providerModelCall": false,
    "modelDownload": false,
    "externalBetaUnlock": false,
    "productionUnlock": false
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

Create a planning-only packet. Decide where persistent Python worker requirement pins and Node package entries should live, how lockfile mutation should be reviewed later, and which owner gates must accept FFmpeg/libass/native-binary warnings before runtime or real-user media beta can open.
