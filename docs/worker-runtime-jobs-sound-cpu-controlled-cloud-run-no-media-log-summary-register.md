# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Log Summary Register

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-log-summary-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-log-summary-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_execution_readback_passed_with_warnings_ready_for_agent_cloud_tool_call_proof",
  "logReadback": {
    "source": "Cloud Logging stdout readback",
    "filter": "cloud_run_job reeditpro-sound-cpu-analysis-worker execution reeditpro-sound-cpu-analysis-worker-rdxcv",
    "stdoutJsonParsed": true,
    "systemEventRead": true,
    "sanitized": true,
    "rawSecretsIncluded": false,
    "mediaPayloadIncluded": false,
    "artifactPayloadIncluded": false
  },
  "runnerSummary": {
    "ok": true,
    "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_proof_observed",
    "requestedToolId": "all",
    "attemptedToolCount": 15,
    "passedToolCount": 15,
    "failedToolCount": 0
  },
  "sideEffects": {
    "mediaOpened": false,
    "realUserMediaUsed": false,
    "outputWrittenToDisk": false,
    "tempArtifactsCreated": false,
    "manifestPersisted": false,
    "publicArtifactCreated": false,
    "signedUrlCreated": false,
    "storageObjectCreated": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "providerCalled": false,
    "modelCalled": false,
    "workerDispatched": false,
    "routeExecuted": false,
    "realExternalAgentUsed": false,
    "runnerNestedDockerCloudRunExecuted": false,
    "betaUnlocked": false,
    "productionUnlocked": false
  }
}
```

The runner-side `runnerNestedDockerCloudRunExecuted` field reflects that no nested Docker or Cloud Run operation occurred inside the job. It does not negate the outer controlled Cloud Run job execution that this packet read back.
