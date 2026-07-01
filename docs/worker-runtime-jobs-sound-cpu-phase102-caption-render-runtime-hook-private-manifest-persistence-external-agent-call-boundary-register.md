# WORKER_RUNTIME_JOBS SOUND CPU Phase 102 External Agent Call Boundary Register

```json worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-external-agent-call-boundary-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase102-caption-render-runtime-hook-private-manifest-persistence-external-agent-call-boundary-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase102_caption_render_runtime_hook_private_manifest_persistence_runtime_execution_contract_plan_completed_with_warnings_ready_for_contract_owner_review_no_execution",
  "externalAgentBoundary": {
    "boundaryName": "sound_cpu_private_manifest_persistence_runtime_execution_contract",
    "futureAllowedCallShape": "external_agent_may_request_private_manifest_persistence_only_after_owner_review_and_later_execution_gate",
    "currentAllowedCallShape": "no_external_agent_call_may_execute_today",
    "currentResponseShape": "blocked_result_only",
    "idempotencyRequired": true,
    "approvedPlanSnapshotRequired": true,
    "workspaceProjectJobIdsRequired": true,
    "runtimeDefaultsMustRemainDisabled": true,
    "noRawPromptAsSourceOfTruth": true,
    "noSignedUrlAsSourceOfTruth": true,
    "noMediaFilePathAsSourceOfTruth": true,
    "noProviderOutputBlobAsSourceOfTruth": true
  },
  "agentExecutionToday": {
    "externalAgentExecutionMayProceed": false,
    "workerDispatchMayProceed": false,
    "routeExecutionMayProceed": false,
    "toolExecutionMayProceed": false,
    "realUserMediaBetaMayProceed": false,
    "paidProductionMayProceed": false
  }
}
```

This boundary is deliberately strict because other lanes are active. It gives those lanes a concrete contract to review while keeping all execution gates closed until the owner-reviewed execution proof gates exist.
