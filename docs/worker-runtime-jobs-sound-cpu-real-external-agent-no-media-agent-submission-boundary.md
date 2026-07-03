# WORKER_RUNTIME_JOBS SOUND CPU Real External-Agent No-Media Agent Submission Boundary

```json worker-runtime-jobs-sound-cpu-real-external-agent-no-media-agent-submission-boundary
{
  "label": "worker-runtime-jobs-sound-cpu-real-external-agent-no-media-agent-submission-boundary",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_real_external_agent_no_media_integration_plan_completed_with_warnings_ready_for_agent_harness_proof",
  "plannedExternalAgentEnvelope": {
    "agentOrigin": "external_agent_no_media_harness",
    "agentSessionId": "opaque_local_test_id_required",
    "agentRequestId": "opaque_local_test_id_required",
    "requestKind": "sound_cpu_agent_callable_no_media_tool_call",
    "adapterMode": "bounded_no_real_media_external_agent_local",
    "syntheticOrNoMediaInput": true,
    "realUserMediaUsed": false,
    "runtimeFlagsMustAllBeFalse": true,
    "toolDescriptorCount": 15
  },
  "plannedForwardingRules": {
    "validateAgentOriginBeforeAdapter": true,
    "stripNoFieldsBeforeAdapter": true,
    "forwardOnlyAllowlistedAdapterFields": true,
    "preserveIdempotencyKey": true,
    "preserveApprovedPlanSnapshotId": true,
    "returnAdapterStdoutJson": true,
    "writeNoFiles": true
  },
  "blockedPayloadFields": [
    "agentSecret",
    "apiKey",
    "oauthToken",
    "rawPrompt",
    "mediaFilePath",
    "sourceMediaUrl",
    "signedUrl",
    "publicArtifactUrl",
    "artifactWriteTarget",
    "providerOutputBlob",
    "serviceRolePayload",
    "supabaseWriteIntent",
    "sqlStatement",
    "modelWeightLocation",
    "gcpResourceTarget",
    "dockerRunRequest",
    "workerDispatchRequest",
    "routeExecutionRequest"
  ]
}
```

The next harness proof should treat the agent as a real caller of the local boundary while still prohibiting secrets, media, persistence, product routes, workers, and artifacts.
