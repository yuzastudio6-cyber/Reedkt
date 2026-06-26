# WORKER_RUNTIME_JOBS SOUND CPU Controlled No-Media No-Artifact Execution Proof Result

```json worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-result
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_import_or_synthetic_failure",
  "sourceVerification": {
    "sourceHead": "861a9926b44dab3ee4af179b9818eb391a26eb9f",
    "pr1101": {
      "status": "merged",
      "mergeCommit": "861a9926b44dab3ee4af179b9818eb391a26eb9f",
      "decision": "worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_execution_plan_completed_with_warnings_ready_for_controlled_no_media_no_artifact_execution_proof"
    }
  },
  "proofScope": {
    "disposableVenvOutsideRepo": true,
    "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
    "mediaAllowed": false,
    "artifactsAllowed": false,
    "workerRouteToolRuntimeAllowed": false,
    "supabaseSqlAllowed": false,
    "providerModelAllowed": false,
    "dockerGcpAllowed": false
  },
  "proofResult": {
    "toolCandidateCount": 15,
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2,
    "expectedImportCount": 14,
    "expectedSyntheticAssertionCount": 5,
    "pipInstallPassed": true,
    "pipInstallDurationSeconds": 41.705,
    "metadataImportSyntheticPhaseCompleted": false,
    "metadataImportSyntheticTimedOut": true,
    "metadataImportSyntheticDurationSeconds": 300.009,
    "tempVenvRemoved": true,
    "packageLockHash": "bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3",
    "firstHarnessAttemptTimedOut": true,
    "runnerTimeoutCleanupHardenedAfterAttempt": true
  },
  "readinessOutcome": {
    "packageProofPassed": false,
    "toolCallReadinessClaimed": false,
    "runtimeReadinessClaimed": false,
    "internalBetaUnlocked": false,
    "externalBetaUnlocked": false,
    "productionUnlocked": false
  },
  "runtimeFlags": {
    "mediaFileOpenAttempted": false,
    "audioreadAudioOpenAttempted": false,
    "pydubMediaOperationAttempted": false,
    "ffmpegExecuted": false,
    "ffprobeExecuted": false,
    "modelDownloadAttempted": false,
    "providerCallAttempted": false,
    "workerExecutionAttempted": false,
    "routeExecutionAttempted": false,
    "toolRuntimeDispatchAttempted": false,
    "gcpCallAttempted": false,
    "dockerCloudRunAttempted": false,
    "supabaseMutationAttempted": false,
    "sqlExecutionAttempted": false,
    "artifactCreationAttempted": false,
    "signedUrlCreationAttempted": false,
    "publicArtifactCreationAttempted": false,
    "generatedLocalFixturePassedClaimed": false,
    "dryRunPassedClaimed": false,
    "runtimeReadinessClaimed": false,
    "toolCallReadinessClaimed": false,
    "mediaProcessingReadinessClaimed": false,
    "betaProductionReadinessClaimed": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NO-MEDIA-NO-ARTIFACT-EXECUTION-PROOF-FIX: isolate SOUND CPU package import timeout, no media/artifacts"
}
```
