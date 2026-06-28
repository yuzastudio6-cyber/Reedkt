# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Real Check Proof After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-proof-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-real-check-proof-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production",
  "sourcePr": 1429,
  "sourceMergeCommit": "04a1c39fc645c4711fab1f888f22efaeb8279651",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_real_check_proof_after_plan_blocked_missing_required_launch_core_dependencies_ready_for_dependency_install_plan_no_runtime_no_production",
  "proofResult": {
    "controlledRealCheckProofExecuted": true,
    "boundedRunner": "runProductionToolReadiness({ realCheckMode: true, strict: false })",
    "dryRun": false,
    "realCheckMode": true,
    "strict": false,
    "coreToolIds": 14,
    "excludedGpuModelToolIds": 13,
    "resultCount": 16,
    "commandVersionChecks": 3,
    "pythonImportChecks": 8,
    "nodePackageMetadataChecks": 3,
    "manualReviewChecks": 1,
    "registryPolicyChecks": 1,
    "passed": 2,
    "warning": 1,
    "missingRequired": 8,
    "notInstalledOptional": 3,
    "pendingManualReview": 1,
    "evaluationOnly": 1,
    "requiredLaunchCoreDependenciesReady": false,
    "launchCoreDependencyInstallPlanRequired": true,
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
    "passed": 2,
    "warning": 1,
    "missing": 8,
    "notInstalled": 3,
    "pendingManualReview": 1,
    "evaluationOnly": 1
  },
  "liveReadinessEvidenceAfterProof": {
    "prodBetaSummary": {
      "status": "warning",
      "externalBetaAllowed": true,
      "realUserMediaBetaAllowed": false,
      "paidProductionAllowed": false
    },
    "prodReadinessSummary": {
      "overallStatus": "blocked",
      "tools": 49,
      "hardBlockers": 101,
      "warnings": 26
    },
    "crossChatOwnershipDiagnostics": {
      "status": "passed",
      "ownershipConflicts": 0,
      "runtimeClaimsClosed": true,
      "supabaseUpdateRequired": false
    }
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-DEPENDENCY-INSTALL-PLAN-AFTER-CONTROLLED-PROOF: plan required launch-core dependency installation, no runtime/no production",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The controlled proof found real launch-core dependency blockers. It proves that the local environment can run the bounded readiness runner, but it does not prove runtime, media, worker, route, beta, or production readiness.
