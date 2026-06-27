# WORKER_RUNTIME_JOBS SOUND CPU Limited Tool-Call Readiness Plan After Image Import Proof Payload Schema

```json worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-payload-schema
{
  "label": "worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof-payload-schema",
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
      "artifactWriteEnabled": false,
      "workerDispatchEnabled": false,
      "routeExecutionEnabled": false,
      "supabaseSqlEnabled": false,
      "providerModelCallsEnabled": false
    },
    "forbiddenFields": [
      "rawPrompt",
      "mediaFilePath",
      "signedUrl",
      "publicUrl",
      "serviceRolePayload",
      "modelWeightPath",
      "artifactWriteTarget"
    ]
  },
  "futureProofResult": {
    "allowedStatuses": ["passed", "failed_safe", "blocked_safety_guard"],
    "mustInclude": ["toolId", "syntheticInputId", "guardResult", "noMediaOpened", "noArtifactWritten"],
    "mustNotInclude": ["mediaBytes", "providerOutput", "signedUrl", "publicArtifactUrl", "secretValue"]
  }
}
```
