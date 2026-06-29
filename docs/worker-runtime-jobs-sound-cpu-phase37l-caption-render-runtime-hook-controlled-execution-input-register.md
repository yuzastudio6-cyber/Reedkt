# WORKER_RUNTIME_JOBS SOUND CPU Phase 37L Caption Render Runtime Hook Controlled Execution Input Register

```json worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-input-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase37l-caption-render-runtime-hook-controlled-execution-input-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase37l_caption_render_runtime_hook_controlled_execution_plan_completed_with_warnings_ready_for_controlled_execution_plan_owner_review_no_execution",
  "futureControlledInputShape": {
    "source": "static synthetic object only",
    "allowedFields": [
      "hookName",
      "jobId",
      "workspaceId",
      "projectId",
      "approvedPlanSnapshotId",
      "captionTrackId",
      "renderSafeZoneProfile",
      "runtimeFlags"
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
      "artifactWriteTarget"
    ]
  },
  "futureProofAllowedAssertions": {
    "factoryReturnsFailClosedResult": true,
    "blockedAssertionConfirmsExecutionBlocked": true,
    "resultContainsNoArtifact": true,
    "resultContainsNoMediaOutput": true,
    "resultPreservesRuntimeDisabledReason": true
  },
  "executedInThisGate": {
    "hookFactoryInvoked": false,
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

The future proof input must be synthetic and no-media/no-artifact. It cannot include raw prompts, real media paths, signed URLs, service-role tokens, provider credentials, model weights, or write targets.
