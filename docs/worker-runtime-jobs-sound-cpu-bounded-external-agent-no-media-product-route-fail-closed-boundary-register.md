# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Product Route Fail-Closed Boundary Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-fail-closed-boundary-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-product-route-fail-closed-boundary-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_product_route_plan_completed_with_warnings_ready_for_product_route_owner_review",
  "requiredFailClosedCases": [
    "route_feature_flag_disabled",
    "invalid_agent_origin",
    "missing_agent_session_id",
    "agentSecret_not_allowed",
    "mediaFilePath_not_allowed",
    "runtime_flags_must_all_be_false",
    "tool_descriptor_not_allowlisted",
    "tool_descriptor_count_mismatch",
    "worker_not_allowlisted",
    "image_not_allowlisted",
    "job_type_not_allowlisted",
    "rawPrompt_not_allowed",
    "supabase_or_storage_target_not_allowed",
    "artifact_target_not_allowed",
    "service_account_not_allowed"
  ],
  "inheritedProofBlockedCaseCount": 11,
  "newRoutePlanningBlockedCaseCount": 4,
  "blockedSideEffects": {
    "routeExecuted": false,
    "workerDispatched": false,
    "jobClaimLeaseMutated": false,
    "realExternalAgentCredentialsUsed": false,
    "realUserMediaUsed": false,
    "mediaOpened": false,
    "mediaProcessed": false,
    "providerCalled": false,
    "modelCalled": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "storageObjectCreated": false,
    "signedUrlCreated": false,
    "publicArtifactCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false
  }
}
```

The future product route must inherit the 11 proven fail-closed envelope cases and add route-specific blocks for disabled flags, storage targets, artifact targets, and service account payloads.
