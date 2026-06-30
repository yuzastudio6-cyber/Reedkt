# WORKER_RUNTIME_JOBS SOUND CPU Phase 48 Caption Render Runtime Hook Blocked-State Source Controlled Execution Input Register

```json worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-input-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase48-caption-render-runtime-hook-blocked-state-source-controlled-execution-input-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_phase48_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_media_no_artifacts",
  "futureSyntheticInputPlan": {
    "inputKind": "synthetic_no_media_no_artifact",
    "approvedPlanSnapshotIdRequired": true,
    "workspaceIdRequired": true,
    "projectIdRequired": true,
    "jobIdRequired": true,
    "idempotencyKeyRequired": true,
    "runtimeDisabledFlagsRequired": true,
    "mediaPathAllowed": false,
    "signedUrlAllowed": false,
    "publicArtifactUrlAllowed": false,
    "rawPromptAllowed": false,
    "providerOutputAllowed": false,
    "serviceRolePayloadAllowed": false
  },
  "futureExpectedResultPlan": {
    "mustBeBlocked": true,
    "mustReportNoArtifactCreated": true,
    "mustReportNoMediaRead": true,
    "mustReportNoWorkerDispatch": true,
    "mustReportNoSupabaseMutation": true,
    "mustPreserveApprovedSnapshotReference": true
  }
}
```

The planned input shape is synthetic and no-media only. It does not permit real media paths, signed URLs, provider blobs, secrets, service-role payloads, or artifact targets.
