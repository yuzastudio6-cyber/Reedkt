# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE114-LIMITED-PRODUCT-TOOL-CALL-EXECUTION-PROOF

```json worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-phase114-limited-product-tool-call-execution-proof",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase113_limited_product_tool_call_execution_owner_review_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_no_real_user_media",
  "expectedDecisionOnPass": "worker_runtime_jobs_sound_cpu_phase114_limited_product_tool_call_execution_proof_passed_with_warnings_ready_for_limited_product_tool_call_execution_proof_owner_review_no_real_user_media",
  "proofScope": {
    "runLimitedProductToolCallBoundary": true,
    "useSyntheticOrNoMediaInputsOnly": true,
    "allowedToolCount": 15,
    "allowedWorkers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "allowedImages": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
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
    "limitedProductToolCallBoundaryInvoked",
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

Run only after the Phase 113 owner review is merged.
