# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE128-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-NO-REAL-USER-MEDIA

```json worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media
{
  "label": "worker-runtime-jobs-sound-cpu-phase128-limited-external-agent-product-tool-call-execution-no-real-user-media",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_no_real_user_media",
  "expectedDecisionOnPass": "worker_runtime_jobs_sound_cpu_phase128_limited_external_agent_product_tool_call_execution_no_real_user_media_passed_with_warnings_ready_for_execution_owner_review_no_real_user_media",
  "executionScope": {
    "runControlledLimitedExternalAgentProductToolCallsNoRealUserMedia": true,
    "expectedInvocationCount": 4,
    "expectedToolDescriptorCountPerInvocation": 15,
    "requireSyntheticNoRealUserMediaInputs": true,
    "requireWhatHappenedForEveryInvocation": true,
    "stopInsteadOfForceOnCriticalBlocker": true,
    "allowRealUserMedia": false,
    "allowRealExternalAgentCredentials": false,
    "allowWorkerDispatch": false,
    "allowRouteExecution": false,
    "allowManifestPersistence": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false,
    "allowStorageObjectCreation": false,
    "allowSignedUrlCreation": false,
    "allowPublicArtifactCreation": false,
    "allowProviderCall": false,
    "allowModelCall": false,
    "allowExternalBetaUnlock": false,
    "allowProductionUnlock": false
  },
  "approvedInvocations": [
    {
      "jobType": "sound.package_import_smoke",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "inputKind": "synthetic_no_real_user_media"
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "inputKind": "synthetic_no_real_user_media"
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "workerName": "sound-cpu-analysis-worker",
      "imageName": "reeditpro/sound-cpu-analysis-worker",
      "inputKind": "synthetic_no_real_user_media"
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "workerName": "sound-audio-metadata-worker",
      "imageName": "reeditpro/sound-audio-metadata-worker",
      "inputKind": "synthetic_no_real_user_media"
    }
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

Run only the controlled no-real-user-media proof. If a real runtime path, real media input, missing evidence, or duplicate/superseding lane appears, stop and report a blocker.
