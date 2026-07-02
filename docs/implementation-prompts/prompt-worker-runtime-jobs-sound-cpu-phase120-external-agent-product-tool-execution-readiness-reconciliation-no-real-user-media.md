# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE120-EXTERNAL-AGENT-PRODUCT-TOOL-EXECUTION-READINESS-RECONCILIATION-NO-REAL-USER-MEDIA

```json worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media
{
  "label": "worker-runtime-jobs-sound-cpu-phase120-external-agent-product-tool-execution-readiness-reconciliation-no-real-user-media",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase119_controlled_product_tool_execution_proof_owner_review_passed_with_warnings_ready_for_external_agent_product_tool_execution_readiness_reconciliation_no_real_user_media",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase120_external_agent_product_tool_execution_readiness_reconciliation_no_real_user_media_completed_with_warnings_ready_for_external_agent_product_tool_execution_readiness_owner_review_no_real_user_media",
  "reconciliationScope": {
    "reconcileExternalAgentProductToolExecutionReadinessOnly": true,
    "allowedToolCount": 15,
    "requiredWorkers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "requiredImages": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "requiredJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "requireWhatHappenedEvidenceRecorded": true,
    "allowProductToolCallExecutionToday": false,
    "allowRealExternalAgentExecutionToday": false,
    "allowRealUserMedia": false,
    "allowWorkerDispatchToday": false,
    "allowRouteExecutionToday": false,
    "allowManifestPersistenceToday": false,
    "allowMediaOpenToday": false,
    "allowProviderCallToday": false,
    "allowModelCallToday": false,
    "allowSupabaseMutationToday": false,
    "allowSqlExecutionToday": false,
    "allowStorageObjectCreationToday": false,
    "allowSignedUrlCreationToday": false,
    "allowArtifactCreationToday": false,
    "allowBetaUnlockToday": false,
    "allowProductionUnlockToday": false
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

Reconcile the Phase119 owner-reviewed no-real-user-media proof against external-agent product tool execution prerequisites. Stop if any owner proof or source evidence fails to record what happened. This prompt must not execute product tool calls, dispatch workers, open media, persist manifests, touch Supabase, create artifacts, or unlock beta.
