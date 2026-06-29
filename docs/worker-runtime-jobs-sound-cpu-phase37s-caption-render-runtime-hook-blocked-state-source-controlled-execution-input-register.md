# WORKER_RUNTIME_JOBS SOUND CPU Phase 37S Caption Render Runtime Hook Blocked-State Source Controlled Execution Input Register

```json worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-input-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-input-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37s_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_execution",
  "futureControlledInputShape": {
    "source": "static synthetic object only",
    "allowedFields": [
      "approvedPlanSnapshotId",
      "integrationPlanId",
      "runtimeDisabledFlags"
    ],
    "requiredSyntheticValues": {
      "approvedPlanSnapshotId": "phase37s-synthetic-approved-plan-snapshot",
      "integrationPlanId": "phase37s-ocr-caption-render-safe-zone-blocked-state-integration-plan"
    },
    "runtimeFlagsRequiredFalse": [
      "workerExecutionEnabled",
      "mediaProcessingEnabled",
      "artifactWritesEnabled",
      "supabaseWritesEnabled",
      "providerCallsEnabled",
      "routeExecutionEnabled",
      "toolExecutionEnabled",
      "renderExecutionEnabled"
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
      "supabaseProjectRef"
    ]
  },
  "futureProofAllowedAssertions": {
    "factoryReturnsFailClosedResult": true,
    "blockedAssertionConfirmsExecutionBlocked": true,
    "resultContainsNoArtifact": true,
    "resultContainsNoMediaOutput": true,
    "resultPreservesRuntimeDisabledFlags": true,
    "resultPreservesOwnerGate": true
  },
  "executedInThisGate": {
    "factoryInvoked": false,
    "blockedAssertionInvoked": false,
    "mediaRead": false,
    "artifactWrite": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "providerCall": false,
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

The future proof input must stay synthetic and no-media/no-artifact. It cannot include raw prompts, real media paths, signed URLs, service-role tokens, provider credentials, model weights, Supabase identifiers, or write targets.
