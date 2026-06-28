# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Persistent Manifest Decision Register

```json worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-decision-register-after-proof
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_proof_owner_review_after_proof_passed_with_warnings_ready_for_persistent_manifest_plan_no_runtime_no_production",
  "sourceProofPr": 1440,
  "sourceProofMergeCommit": "8205ef04f3eafe7aaf118b1673b99fb01d30cefb",
  "persistentManifestDecision": {
    "pythonWorkerRequirementPinsShouldBePlanned": true,
    "nodePackageManifestPlacementShouldBePlanned": true,
    "sourceLockfileMutationApprovedToday": false,
    "requirementsFileMutationApprovedToday": false,
    "packageManifestMutationApprovedToday": false,
    "runtimeInstallApprovedToday": false
  },
  "futureManifestCandidates": {
    "pythonPackages": [
      "av",
      "scenedetect",
      "opencv-python-headless",
      "duckdb",
      "polars",
      "opentimelineio"
    ],
    "nodePackages": [
      "sharp",
      "remotion"
    ],
    "optionalDeferredPackages": [
      "OpenImageIO",
      "PyOpenColorIO",
      "hyperframe"
    ]
  },
  "requiredFuturePlanningChecks": [
    "select the persistent worker requirements path before source mutation",
    "decide package.json section ownership for sharp and remotion before source mutation",
    "preserve package-lock review before any lockfile mutation",
    "separate optional native packages from required launch-core closure",
    "keep FFmpeg LGPL and libass warnings visible until policy review"
  ],
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-PLAN-AFTER-PROOF-REVIEW: plan persistent launch-core dependency manifests, no runtime/no production",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
