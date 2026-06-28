# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Node Proof Register After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-node-proof-register-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-node-proof-register-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production",
  "sourcePr": 1435,
  "sourceMergeCommit": "70c37bbee038b46bb67785e16d489a506ec4b1df",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_dependency_install_proof_after_plan_passed_required_checks_with_warnings_ready_for_dependency_install_proof_owner_review_no_runtime_no_production",
  "nodeProof": {
    "installMode": "npm install --ignore-scripts --no-save --no-package-lock sharp remotion",
    "packageJsonChanged": false,
    "packageLockChanged": false,
    "nodeModulesStaged": false,
    "metadataOnly": true,
    "runtimeImported": false,
    "imageProcessingExecuted": false,
    "remotionRenderExecuted": false,
    "metadataResolverFixApplied": true,
    "metadataResolverFix": "fallback from packageJsonPath subpath to package entry root package.json without executing package code",
    "requiredNodePackages": [
      {
        "packageName": "sharp",
        "version": "0.35.2",
        "license": "Apache-2.0",
        "metadataStatus": "passed"
      },
      {
        "packageName": "remotion",
        "version": "4.0.484",
        "license": "SEE LICENSE IN LICENSE.md",
        "metadataStatus": "passed"
      }
    ],
    "deferredNodePackages": [
      {
        "packageName": "hyperframe",
        "metadataStatus": "not_installed",
        "reason": "optional preview/timeline package remains deferred"
      }
    ]
  },
  "nodeProofConclusion": {
    "requiredNodeMetadataPassed": true,
    "requiredNodePackageCount": 2,
    "optionalNodePackagesStillDeferred": 1,
    "manifestPersistenceStillRequired": true,
    "renderExecutionApproved": false,
    "imageProcessingApproved": false
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

The Node proof installed packages only into ignored local `node_modules` for metadata resolution. It did not persist dependency manifests.
