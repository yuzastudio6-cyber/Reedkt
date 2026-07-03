# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Fail-Closed Boundary Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-fail-closed-boundary-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-fail-closed-boundary-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof",
  "failClosedBoundaries": {
    "invalidAgentOriginBlocks": true,
    "agentSecretBlocks": true,
    "mediaPathBlocks": true,
    "trueRuntimeFlagBlocks": true,
    "missingIdentityFieldsBlock": true,
    "unknownToolBlocks": true,
    "toolCountMismatchBlocks": true,
    "unknownWorkerBlocks": true,
    "unknownImageBlocks": true,
    "unknownJobTypeBlocks": true
  },
  "forbiddenPayloadFields": [
    "rawPrompt",
    "agentSecret",
    "apiKey",
    "oauthToken",
    "serviceAccountJson",
    "secretManagerRef",
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
  ],
  "runtimeFlagPolicy": {
    "allRuntimeFlagsMustRemainFalse": true,
    "allowRealExternalAgentExecution": false,
    "allowRealUserMedia": false,
    "allowWorkerDispatch": false,
    "allowRouteExecution": false,
    "allowManifestPersistence": false,
    "allowMediaOpen": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false
  }
}
```

The bounded surface must fail closed for credentials, media paths, runtime flags, route or worker execution, persistence, storage, Supabase, SQL, artifacts, and unknown tools.
