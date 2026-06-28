# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Dependency Install Proof After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-proof-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-proof-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production",
  "sourcePr": 1435,
  "sourceMergeCommit": "70c37bbee038b46bb67785e16d489a506ec4b1df",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_dependency_install_proof_after_plan_passed_required_checks_with_warnings_ready_for_dependency_install_proof_owner_review_no_runtime_no_production",
  "proofResult": {
    "controlledDependencyInstallProofExecuted": true,
    "boundedRunner": "runProductionToolReadiness({ realCheckMode: true, strict: false })",
    "metadataResolverFixApplied": true,
    "pythonDisposableVenvUsed": true,
    "tempVenvRemoved": true,
    "nodeInstallMode": "npm install --ignore-scripts --no-save --no-package-lock sharp remotion",
    "packageJsonChanged": false,
    "packageLockChanged": false,
    "dryRun": false,
    "realCheckMode": true,
    "strict": false,
    "coreToolIds": 14,
    "excludedGpuModelToolIds": 13,
    "resultCount": 16,
    "passed": 10,
    "warning": 1,
    "missingRequired": 0,
    "notInstalledOptional": 3,
    "pendingManualReview": 1,
    "evaluationOnly": 1,
    "requiredLaunchCoreChecksPassed": true,
    "boundedExternalBetaScorecardAllowed": true,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false,
    "runtimeExecutionApprovedToday": false,
    "workerExecutionApprovedToday": false,
    "routeExecutionApprovedToday": false,
    "productToolCallExecutionApprovedToday": false,
    "mediaProcessingApprovedToday": false,
    "realUserMediaReadApprovedToday": false,
    "artifactDeliveryApprovedToday": false,
    "modelDownloadApprovedToday": false,
    "providerModelCallApprovedToday": false,
    "deploymentApprovedToday": false,
    "cloudRunApprovedToday": false,
    "dockerBuildRunPushApprovedToday": false,
    "supabaseMutationApprovedToday": false,
    "sqlExecutionApprovedToday": false,
    "generatedLocalFixturePassedClaimedToday": false,
    "dryRunPassedClaimedToday": false,
    "runtimeReadinessClaimedToday": false,
    "mediaReadinessClaimedToday": false
  },
  "statusCounts": {
    "passed": 10,
    "warning": 1,
    "missing": 0,
    "notInstalled": 3,
    "pendingManualReview": 1,
    "evaluationOnly": 1
  },
  "liveReadinessEvidenceAfterProof": {
    "productionBlockedToolsInBoundedProof": [],
    "remainingOptionalOrManualItems": [
      "libass_filter_inspection_warning",
      "openimageio_optional_not_installed",
      "opencolorio_optional_not_installed",
      "hyperframe_optional_not_installed",
      "ffmpeg_lgpl_safe_build_manual_review",
      "revideo_evaluation_only_policy"
    ]
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PROOF-OWNER-REVIEW-AFTER-PROOF: review controlled launch-core dependency install proof, no runtime/no production",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The controlled proof proves the required launch-core command/import/package-metadata checks can pass in a bounded local proof environment. It does not persist dependencies into production manifests and does not approve media, runtime, beta, or production execution.
