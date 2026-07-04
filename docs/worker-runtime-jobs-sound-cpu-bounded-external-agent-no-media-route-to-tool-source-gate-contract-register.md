# WORKER_RUNTIME_JOBS SOUND CPU Bounded No-Media Route-To-Tool Source Gate Contract Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-source-gate-contract-register
{
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_source_gate_completed_with_warnings_ready_for_controlled_route_to_tool_proof",
  "acceptedEnvelopeRequirements": [
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
  "acceptedToolCount": 15,
  "runnerRequestMode": "bounded_external_agent_no_media_controlled_tool_execution",
  "routeResponseModes": {
    "envGateDisabled": "409_fail_closed",
    "unsafeEnvelope": "400_fail_closed_before_runner",
    "controlledRunnerFailure": "500_fail_closed_after_validation",
    "controlledRunnerSuccess": "200_bounded_no_media_tool_result"
  },
  "sideEffectClosures": {
    "workerDispatch": false,
    "mediaOpen": false,
    "providerModelCall": false,
    "supabaseSql": false,
    "artifactWrite": false,
    "dockerCloudRun": false
  }
}
```
