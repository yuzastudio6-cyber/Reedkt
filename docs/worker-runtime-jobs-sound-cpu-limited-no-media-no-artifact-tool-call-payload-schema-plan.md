# WORKER_RUNTIME_JOBS SOUND CPU Limited No-Media No-Artifact Tool-Call Payload Schema Plan

```json worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-payload-schema-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_completed_with_warnings_ready_for_controlled_tool_call_readiness_proof",
  "futureProofPayload": {
    "requiredFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "toolId",
      "callCategory",
      "syntheticInputId",
      "runtimeFlags",
      "attempt"
    ],
    "runtimeFlagsMustEqual": {
      "mediaFileOpenEnabled": false,
      "mediaProcessingEnabled": false,
      "artifactWritesEnabled": false,
      "supabaseWritesEnabled": false,
      "providerCallsEnabled": false,
      "workerDispatchEnabled": false,
      "routeExecutionEnabled": false
    },
    "forbiddenFields": [
      "rawPrompt",
      "mediaFilePath",
      "signedUrl",
      "publicUrl",
      "providerOutputBlob",
      "serviceRolePayload",
      "supabaseConnectionString",
      "artifactWriteTarget",
      "modelWeightPath"
    ]
  },
  "futureProofResult": {
    "requiredFields": [
      "toolId",
      "callCategory",
      "status",
      "durationMs",
      "sanitizedSummary",
      "runtimeFlagsObserved",
      "noMediaOpened",
      "noArtifactsCreated",
      "noExternalCalls",
      "errorClass"
    ],
    "allowedStatuses": [
      "passed",
      "skipped_by_policy",
      "blocked_preflight",
      "failed_safe"
    ],
    "forbiddenResultFields": [
      "rawProviderOutput",
      "mediaBytes",
      "artifactUrl",
      "secretValue",
      "databaseRowDump"
    ]
  }
}
```
