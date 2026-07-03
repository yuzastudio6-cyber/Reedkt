# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Disabled Route Source Fail Closed Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-fail-closed-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-disabled-route-source-fail-closed-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_disabled_route_source_creation_plan_completed_with_warnings_ready_for_disabled_route_source_owner_review",
  "futureUnsafeEnvelopeCases": [
    "missing_approved_plan_snapshot",
    "missing_workspace",
    "missing_project",
    "missing_job_id",
    "missing_idempotency_key",
    "invalid_worker",
    "invalid_image",
    "invalid_job_type",
    "runtime_flag_true",
    "real_media_reference_present",
    "signed_url_present",
    "public_artifact_target_present",
    "provider_or_model_payload_present",
    "supabase_or_sql_target_present",
    "credential_or_secret_present"
  ],
  "requiredFailureBehavior": {
    "returnStructuredJson": true,
    "explainBlockedReason": true,
    "startWorker": false,
    "openMedia": false,
    "persistResult": false,
    "writeArtifact": false,
    "mutateSupabase": false,
    "executeSql": false,
    "callProviderOrModel": false,
    "runDockerOrCloudRun": false
  },
  "currentGateObservedSideEffects": {
    "routeExecution": false,
    "workerExecution": false,
    "workerDispatch": false,
    "jobClaimLeaseMutation": false,
    "realExternalAgentCredentialProvisioning": false,
    "realUserMediaRead": false,
    "mediaProcessing": false,
    "artifactCreation": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "storageTransfer": false,
    "signedUrlCreation": false,
    "publicArtifactCreation": false,
    "providerModelCall": false,
    "dockerGcpAction": false,
    "betaUnlock": false,
    "productionUnlock": false
  }
}
```

Every unsafe envelope remains a blocked JSON result, not a fallback to worker, route, media, storage, provider, or Supabase execution.
