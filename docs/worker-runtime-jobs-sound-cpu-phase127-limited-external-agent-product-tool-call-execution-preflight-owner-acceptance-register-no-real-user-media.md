# WORKER_RUNTIME_JOBS SOUND CPU Phase 127 Limited External-Agent Product Tool-Call Execution Preflight Owner Acceptance Register No Real User Media

```json worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-acceptance-register-no-real-user-media
{
  "label": "worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-owner-acceptance-register-no-real-user-media",
  "decision": "worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_owner_review_passed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_no_real_user_media",
  "acceptedPreflightEvidence": {
    "sourcePr": 2111,
    "sourceMergeCommit": "03720cba59ab55e5093bf06f53a2701bd2e9165a",
    "toolCountPreflighted": 15,
    "workerNamesAccepted": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "imageNamesAccepted": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypesAccepted": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "plannedInvocationCount": 4,
    "whatHappenedEvidenceRequired": true,
    "whatHappenedRowsCarriedForward": 4
  },
  "acceptedForNextGateOnly": {
    "controlledLimitedExternalAgentProductToolCallExecutionNoRealUserMedia": true,
    "plannedInvocationCount": 4,
    "stopOnCriticalBlocker": true,
    "recordWhatHappenedForEveryInvocation": true
  },
  "blockedToday": {
    "realExternalAgentExecution": "blocked",
    "realUserMediaExecution": "blocked",
    "workerDispatch": "blocked",
    "routeExecution": "blocked",
    "manifestPersistence": "blocked",
    "supabaseMutation": "blocked",
    "sqlExecution": "blocked",
    "storageObjectCreation": "blocked",
    "signedUrlCreation": "blocked",
    "publicArtifactCreation": "blocked",
    "providerCall": "blocked",
    "modelCall": "blocked",
    "externalBetaUnlock": "blocked",
    "productionUnlock": "blocked"
  }
}
```

This register accepts only the controlled next-gate proof shape, not broad runtime readiness.
