# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE109-CONTROLLED-EXTERNAL-AGENT-EXECUTION-PROOF

```json worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-phase109-controlled-external-agent-execution-proof",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase108_external_agent_execution_owner_review_passed_with_warnings_ready_for_controlled_external_agent_execution_proof_no_runtime_side_effects",
  "expectedDecisionOnPass": "worker_runtime_jobs_sound_cpu_phase109_controlled_external_agent_execution_proof_passed_with_warnings_ready_for_external_agent_execution_proof_owner_review_no_runtime_side_effects",
  "proofScope": {
    "runControlledExternalAgentBoundary": true,
    "useSyntheticPayloadOnly": true,
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
    "allowRealExternalAgentExecution": false,
    "allowProductToolCallExecution": false,
    "allowWorkerDispatch": false,
    "allowRouteExecution": false,
    "allowFactorySideEffects": false,
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
    "agentBoundaryInvoked",
    "syntheticPayloadAccepted",
    "toolCountCovered",
    "runtimeFlagsAllFalse",
    "workerDispatchedFalse",
    "routeExecutedFalse",
    "factorySideEffectsFalse",
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

Run only after the Phase 108 owner review is merged.
