# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Node Manifest Placement Plan After Proof Review

```json worker-runtime-jobs-sound-cpu-launch-core-node-manifest-placement-plan-after-proof-review
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_plan_after_proof_review_completed_with_warnings_ready_for_persistent_manifest_source_plan_no_runtime_no_production",
  "sourceOwnerReviewPr": 1442,
  "sourceOwnerReviewMergeCommit": "e35acdd53893deb028baac3774e1ec258db42c50",
  "selectedFutureManifestPath": "package.json",
  "selectedFutureManifestSection": "dependencies",
  "selectedFutureLockfilePath": "package-lock.json",
  "pathDecision": {
    "rootPackageJsonSelectedForLaterSourcePlan": true,
    "dependenciesSectionSelectedForLaterSourcePlan": true,
    "devDependenciesSelected": false,
    "optionalDependenciesSelected": false,
    "packageJsonMutationApprovedToday": false,
    "packageLockMutationApprovedToday": false,
    "reason": "The repo currently uses a single root package manifest. Sharp and Remotion are runtime worker/render dependencies, so a later source plan should add them to root dependencies with lockfile review, not to frontend-only or dev-only scope."
  },
  "plannedNodeDependencies": [
    {
      "packageName": "sharp",
      "proofVersion": "0.35.2",
      "license": "Apache-2.0",
      "futurePinStrategy": "exact_pin_from_proof_metadata",
      "sourceMutationApprovedToday": false,
      "runtimeExecutionApprovedToday": false
    },
    {
      "packageName": "remotion",
      "proofVersion": "4.0.484",
      "license": "SEE LICENSE IN LICENSE.md",
      "futurePinStrategy": "exact_pin_from_proof_metadata",
      "sourceMutationApprovedToday": false,
      "runtimeExecutionApprovedToday": false
    }
  ],
  "deferredNodeDependency": {
    "packageName": "hyperframe",
    "status": "optional_deferred",
    "sourceMutationApprovedToday": false
  },
  "futureSourceGateRequirements": [
    "perform package-lock review in the source mutation gate before committing any dependency change",
    "preserve the metadata resolver fallback for packages that do not export package.json",
    "do not run Sharp image processing or Remotion rendering in the manifest source plan",
    "verify no frontend bundle imports are introduced by dependency persistence alone",
    "keep optional hyperframe deferred until separately approved"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```
