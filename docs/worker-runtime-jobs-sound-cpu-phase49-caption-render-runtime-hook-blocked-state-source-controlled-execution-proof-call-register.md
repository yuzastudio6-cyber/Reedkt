# WORKER_RUNTIME_JOBS SOUND CPU Phase 49 Caption Render Runtime Hook Blocked-State Source Controlled Execution Proof Call Register

```json worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-call-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase49-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-call-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase49_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts",
  "allowedFactoryCalls": [
    "createSoundCpuOcrCaptionRenderSafeZoneHookBlockedResult",
    "createSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationResult",
    "createSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationBlockedResult"
  ],
  "allowedBlockedAssertionCalls": [
    "assertSoundCpuOcrCaptionRenderSafeZoneHookExecutionBlocked",
    "assertSoundCpuOcrCaptionRenderSafeZoneBlockedStateIntegrationExecutionBlocked",
    "assertSoundCpuOcrCaptionRenderSafeZoneRuntimeIntegrationExecutionBlocked"
  ],
  "callCounts": {
    "factoryInvocationCount": 3,
    "blockedAssertionInvocationCount": 3,
    "matchedExpectedBlockedReasons": 3,
    "unexpectedSuccessCount": 0,
    "unexpectedErrorCount": 0
  },
  "callBoundaries": {
    "callsContainedInTemporaryProofFileOnly": true,
    "temporaryProofFileRemovedBeforeStaging": true,
    "runtimeHookExecutionOverMedia": false,
    "workerDispatch": false,
    "routeToolProviderCall": false,
    "mediaProcessing": false,
    "artifactCreation": false,
    "supabaseSql": false
  }
}
```

Only the three blocked-result factories and the three blocked assertion functions were invoked, and only inside the temporary proof file.
