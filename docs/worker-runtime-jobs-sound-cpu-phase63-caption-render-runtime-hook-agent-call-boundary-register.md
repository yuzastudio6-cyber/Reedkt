# WORKER_RUNTIME_JOBS SOUND CPU Phase 63 Caption Render Runtime Hook Agent Call Boundary Register

```json worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-agent-call-boundary-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase63-caption-render-runtime-hook-agent-call-boundary-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase63_caption_render_runtime_hook_blocked_state_source_runtime_integration_external_agent_execution_plan_completed_with_warnings_ready_for_external_agent_execution_plan_owner_review_no_media_no_artifacts",
  "plannedAgentCallContract": {
    "approvedPlanSnapshotId": "required_future_static_field",
    "workspaceId": "required_future_static_field",
    "projectId": "required_future_static_field",
    "jobId": "required_future_static_field",
    "idempotencyKey": "required_future_static_field",
    "hookSource": "server/workers/sound-cpu/runtime/soundCpuOcrCaptionRenderSafeZoneHook.ts",
    "inputBundleKind": "synthetic_no_media_no_artifact_caption_boundary_bundle",
    "outputKind": "blocked_result_metadata_only",
    "artifactWriteTarget": "forbidden",
    "signedUrlInput": "forbidden",
    "serviceRolePayload": "forbidden"
  },
  "runtimeFlagsMustRemainFalse": {
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": false,
    "REEDITPRO_WORKER_EXECUTION_ENABLED": false,
    "REEDITPRO_MEDIA_PROCESSING_ENABLED": false,
    "artifactCreationApproved": false,
    "supabaseSqlApproved": false
  },
  "executionToday": {
    "externalAgentExecuted": false,
    "workerDispatched": false,
    "routeToolProviderCalled": false,
    "realMediaOpened": false,
    "artifactCreated": false,
    "supabaseSqlTouched": false
  }
}
```

The planned agent call contract is metadata-only and fail-closed. It is not an execution approval.
