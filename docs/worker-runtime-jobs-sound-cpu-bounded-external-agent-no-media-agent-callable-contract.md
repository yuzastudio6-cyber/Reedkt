# WORKER_RUNTIME_JOBS SOUND CPU Bounded No-Media Agent-Callable Contract

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-agent-callable-contract
{
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_agent_callable_execution_ready_with_warnings",
  "routeContract": {
    "method": "POST",
    "path": "/api/internal/workers/sound-cpu/no-media-agent-call",
    "requiredEnvGate": {
      "name": "REEDITPRO_SOUND_CPU_NO_MEDIA_ROUTE_TO_TOOL_EXECUTION_ENABLED",
      "value": "1"
    },
    "requiredEnvelopeFields": [
      "approvedPlanSnapshotId",
      "workspaceId",
      "projectId",
      "jobId",
      "idempotencyKey",
      "workerName",
      "imageName",
      "jobType",
      "toolId",
      "attemptMetadata",
      "staticOnlyRuntimeFlags"
    ],
    "rejectedInputs": [
      "rawPrompt",
      "mediaFilePath",
      "sourceMediaUrl",
      "signedUrl",
      "publicArtifactUrl",
      "serviceRolePayload",
      "providerOutputBlob",
      "supabaseWriteIntent",
      "sqlStatement",
      "modelWeightLocation",
      "gcpResourceTarget",
      "dockerRunRequest",
      "workerDispatchRequest"
    ]
  }
}
```
