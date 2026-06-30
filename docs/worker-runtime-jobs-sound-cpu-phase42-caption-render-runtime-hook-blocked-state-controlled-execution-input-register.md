# WORKER_RUNTIME_JOBS SOUND CPU Phase 42 Caption Render Runtime Hook Blocked-State Controlled Execution Input Register

```json worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-input-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase42-caption-render-runtime-hook-blocked-state-controlled-execution-input-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase42_caption_render_runtime_hook_blocked_state_controlled_execution_plan_completed_with_warnings_ready_for_plan_owner_review_no_media_no_artifacts",
  "futureControlledInputShape": {
    "source": "static synthetic object only",
    "allowedFields": [
      "approvedPlanSnapshotId",
      "runtimeIntegrationPlanId",
      "blockedStateIntegrationPlanId",
      "runtimeDisabledFlags"
    ],
    "runtimeFlagsRequiredFalse": [
      "ocrRuntimeEnabled",
      "captionRenderRuntimeEnabled",
      "workerExecutionEnabled",
      "mediaProcessingEnabled",
      "artifactWritesEnabled",
      "supabaseWritesEnabled",
      "providerCallsEnabled"
    ],
    "blockedFields": [
      "rawPrompt",
      "mediaFilePath",
      "mediaBytes",
      "signedUrl",
      "publicArtifactUrl",
      "serviceRoleToken",
      "providerCredential",
      "modelWeightPath",
      "artifactWriteTarget",
      "workerDispatchTarget",
      "routeInvocationTarget"
    ]
  },
  "futureProofAllowedAssertions": {
    "factoryReturnsFailClosedResult": true,
    "blockedAssertionThrowsBlockedReason": true,
    "resultContainsNoArtifact": true,
    "resultContainsNoMediaOutput": true,
    "resultPreservesRuntimeDisabledReason": true,
    "blockedStateIntegrationResultRemainsFailClosed": true
  },
  "executedInThisGate": {
    "blockedResultFactoryInvoked": false,
    "blockedAssertionInvoked": false,
    "mediaRead": false,
    "artifactWrite": false,
    "workerExecution": false,
    "routeExecution": false,
    "supabaseSql": false
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

The future proof input must remain synthetic and no-media/no-artifact. It cannot contain raw prompts, real media paths, signed URLs, service-role tokens, provider credentials, model weights, worker dispatch targets, route invocation targets, or write targets.
