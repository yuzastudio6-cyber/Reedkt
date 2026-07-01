# WORKER_RUNTIME_JOBS SOUND CPU Phase 110 Limited External-Agent Execution Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-acceptance-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase110-limited-external-agent-execution-owner-acceptance-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase110_limited_external_agent_execution_owner_review_passed_with_warnings_ready_for_limited_external_agent_execution_proof_no_real_user_media",
  "acceptedPlanElements": {
    "limitedExecutionEnvelope": true,
    "syntheticOrNoMediaInputsOnly": true,
    "requiredEnvelopeFields": true,
    "runtimeFlagsMustRemainFalse": true,
    "stopConditions": true,
    "cleanupExpectations": true,
    "toolCount": 15
  },
  "acceptedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "acceptedForNextProofOnly": {
    "limitedExternalAgentBoundary": true,
    "syntheticOrNoMediaPayload": true,
    "allRuntimeFlagsFalse": true,
    "stopOnCriticalBoundary": true
  },
  "notAcceptedForToday": {
    "realExternalAgentExecution": true,
    "realUserMedia": true,
    "workerDispatch": true,
    "routeExecution": true,
    "manifestPersistence": true,
    "mediaOpen": true,
    "providerOrModelCall": true,
    "supabaseOrSql": true,
    "storageOrSignedUrl": true,
    "artifactCreation": true,
    "betaUnlock": true,
    "productionUnlock": true
  }
}
```

The accepted plan is narrow enough to try a limited proof next.
