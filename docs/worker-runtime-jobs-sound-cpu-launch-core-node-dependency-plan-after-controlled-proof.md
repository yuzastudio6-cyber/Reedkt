# WORKER_RUNTIME_JOBS SOUND CPU Launch Core Node Dependency Plan After Controlled Proof

```json worker-runtime-jobs-sound-cpu-launch-core-node-dependency-plan-after-controlled-proof
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-node-dependency-plan-after-controlled-proof",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production",
  "sourcePr": 1433,
  "sourceMergeCommit": "d1dfda8e6f416d26c2195be08e422d9178322063",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production",
  "currentRootPackageManifest": {
    "sharp": "absent",
    "remotion": "absent",
    "hyperframe": "absent",
    "packageLockContainsSharp": false,
    "packageLockContainsRemotion": false,
    "packageLockContainsHyperframe": false
  },
  "requiredNodePackages": [
    {
      "toolId": "sharp",
      "packageName": "sharp",
      "metadataPath": "sharp/package.json",
      "currentProofStatus": "missing",
      "installPlan": "add as controlled dependency only after native/libvips and untrusted-image policy review is represented"
    },
    {
      "toolId": "remotion",
      "packageName": "remotion",
      "metadataPath": "remotion/package.json",
      "currentProofStatus": "missing",
      "installPlan": "add as controlled dependency only for metadata/readiness proof; render execution remains blocked"
    }
  ],
  "deferredNodePackages": [
    {
      "toolId": "hyperframe",
      "packageName": "hyperframe",
      "metadataPath": "hyperframe/package.json",
      "currentProofStatus": "not_installed",
      "reason": "optional preview/timeline package; defer until preview owner plan"
    }
  ],
  "nodePlanConclusion": {
    "requiredNodePackageCount": 2,
    "optionalNodePackageCount": 1,
    "packageManifestChangeApprovedToday": false,
    "packageLockChangeApprovedToday": false,
    "nextGateMayPerformControlledPackageInstall": true,
    "renderExecutionApprovedToday": false,
    "imageProcessingApprovedToday": false
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

The Node plan is metadata-first. It does not approve image processing, Remotion rendering, browser capture, final export, or runtime worker execution.
