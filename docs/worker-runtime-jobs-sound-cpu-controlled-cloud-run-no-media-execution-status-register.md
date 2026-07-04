# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Execution Status Register

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-status-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-status-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_execution_readback_passed_with_warnings_ready_for_agent_cloud_tool_call_proof",
  "execution": {
    "project": "reeditpro",
    "region": "us-central1",
    "jobName": "reeditpro-sound-cpu-analysis-worker",
    "executionName": "reeditpro-sound-cpu-analysis-worker-rdxcv",
    "state": "completed",
    "completedCondition": true,
    "resourcesAvailable": true,
    "started": true,
    "containerReady": true,
    "succeededCount": 1,
    "completionMessage": "Execution completed successfully in 1m58.04s.",
    "containerExit": "exit(0)"
  },
  "jobConfiguration": {
    "image": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker@sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366",
    "serviceAccount": "reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "cpu": "2",
    "memory": "4Gi",
    "maxRetries": 0,
    "timeoutSeconds": 600
  },
  "disabledEnvFlags": {
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
    "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
    "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
    "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0",
    "REEDITPRO_EXTERNAL_BETA_READY": "false",
    "REEDITPRO_PRODUCTION_READY": "false"
  },
  "otherJobExecutions": {
    "metadataWorkerJob": "reeditpro-sound-audio-metadata-worker",
    "metadataWorkerExecutionCountObserved": 0,
    "metadataWorkerExecuted": false
  }
}
```

Only the already-created analysis-worker execution was read back. No second Cloud Run job execution was started for this packet.
