# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Execution Surface Proof Fail-Closed Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-fail-closed-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-execution-surface-proof-fail-closed-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_proof_passed_with_warnings_ready_for_surface_owner_review",
  "blockedCaseCount": 11,
  "blockedInvocations": [
    {
      "name": "invalid_agent_origin",
      "expectedStopReason": "agent_origin_invalid",
      "status": "blocked"
    },
    {
      "name": "missing_agent_session_id",
      "expectedStopReason": "agent_session_id_required",
      "status": "blocked"
    },
    {
      "name": "agent_secret",
      "expectedStopReason": "agentSecret_not_allowed",
      "status": "blocked"
    },
    {
      "name": "adapter_media_path",
      "expectedStopReason": "adapter_mediaFilePath_not_allowed",
      "status": "blocked"
    },
    {
      "name": "adapter_true_runtime_flag",
      "expectedStopReason": "adapter_runtime_flags_must_all_be_false",
      "status": "blocked"
    },
    {
      "name": "adapter_unknown_tool",
      "expectedStopReason": "adapter_tool_descriptor_0_tool_id_not_allowlisted",
      "status": "blocked"
    },
    {
      "name": "adapter_tool_count_mismatch",
      "expectedStopReason": "adapter_tool_descriptor_count_mismatch",
      "status": "blocked"
    },
    {
      "name": "adapter_unknown_worker",
      "expectedStopReason": "adapter_worker_not_allowlisted",
      "status": "blocked"
    },
    {
      "name": "adapter_unknown_image",
      "expectedStopReason": "adapter_image_not_allowlisted",
      "status": "blocked"
    },
    {
      "name": "adapter_unknown_job_type",
      "expectedStopReason": "adapter_job_type_not_allowlisted",
      "status": "blocked"
    },
    {
      "name": "adapter_raw_prompt",
      "expectedStopReason": "adapter_rawPrompt_not_allowed",
      "status": "blocked"
    }
  ],
  "blockedSideEffects": {
    "realExternalAgentCredentialsUsed": false,
    "realUserMediaUsed": false,
    "mediaOpened": false,
    "workerDispatched": false,
    "routeExecuted": false,
    "manifestPersisted": false,
    "providerCalled": false,
    "modelCalled": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "storageObjectCreated": false,
    "signedUrlCreated": false,
    "publicArtifactCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "outputWrittenToDisk": false,
    "tempArtifactsCreated": false
  }
}
```

The proof requires unsafe, incomplete, or widened envelopes to fail closed before any media, worker, route, persistence, Supabase, artifact, credential, provider, or model path can run.
