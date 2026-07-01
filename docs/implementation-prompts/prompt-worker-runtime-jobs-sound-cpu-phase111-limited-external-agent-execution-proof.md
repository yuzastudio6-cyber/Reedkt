# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE111-LIMITED-EXTERNAL-AGENT-EXECUTION-PROOF

```json worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-phase111-limited-external-agent-execution-proof",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_owner_review_passed_with_warnings_ready_for_limited_external_agent_execution_proof_no_real_user_media",
  "expectedDecisionOnPass": "worker_runtime_jobs_sound_cpu_phase111_limited_external_agent_execution_proof_passed_with_warnings_ready_for_limited_external_agent_execution_proof_owner_review_no_real_user_media",
  "proofScope": {
    "runLimitedExternalAgentBoundary": true,
    "useSyntheticOrNoMediaInputsOnly": true,
    "allowedToolCount": 15,
    "allowedWorkers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "allowedJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "allowRealUserMedia": false,
    "allowWorkerDispatch": false,
    "allowRouteExecution": false,
    "allowManifestPersistence": false,
    "allowMediaOpen": false,
    "allowProviderCall": false,
    "allowModelCall": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false,
    "allowStorageObjectCreation": false,
    "allowSignedUrlCreation": false,
    "allowArtifactCreation": false,
    "allowBetaUnlock": false,
    "allowProductionUnlock": false
  },
  "requiredOutputEvidence": [
    "sourceDecisionVerified",
    "limitedBoundaryInvoked",
    "syntheticOrNoMediaInputAccepted",
    "toolCountCovered",
    "runtimeFlagsAllFalse",
    "realUserMediaUsedFalse",
    "workerDispatchedFalse",
    "routeExecutedFalse",
    "manifestPersistedFalse",
    "mediaOpenedFalse",
    "supabaseTouchedFalse",
    "artifactCreatedFalse",
    "readinessClaimsUnchanged"
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

Run only after the Phase 110 owner review is merged.
