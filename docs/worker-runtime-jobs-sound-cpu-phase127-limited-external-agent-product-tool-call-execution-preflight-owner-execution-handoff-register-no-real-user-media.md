# WORKER_RUNTIME_JOBS SOUND CPU Phase 127 Limited External-Agent Product Tool-Call Execution Preflight Owner Execution Handoff Register No Real User Media

```json worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media
{
  "label": "worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-execution-handoff-register-no-real-user-media",
  "decision": "worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_no_real_user_media",
  "nextExecutionTarget": {
    "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE128-LIMITED-EXTERNAL-AGENT-PRODUCT-TOOL-CALL-EXECUTION-NO-REAL-USER-MEDIA",
    "mayRunControlledLimitedExternalAgentProductToolCallsNoRealUserMedia": true,
    "expectedInvocationCount": 4,
    "expectedToolDescriptorCountPerInvocation": 15,
    "requireWhatHappenedRows": 4,
    "requireSyntheticNoRealUserMediaInputs": true,
    "requireStopInsteadOfForceOnCriticalBlocker": true
  },
  "invocationsApprovedForNextGate": [
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
  "notApprovedForNextGate": {
    "realUserMedia": true,
    "realExternalAgentCredentials": true,
    "workerDispatch": true,
    "routeExecution": true,
    "manifestPersistence": true,
    "supabaseMutation": true,
    "artifactCreation": true,
    "betaUnlock": true,
    "productionUnlock": true
  }
}
```

The next gate may run only the listed controlled no-real-user-media product tool-call proof.
