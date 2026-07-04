# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Execution Readback Blocker Register

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-blocker-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-execution-readback-blocker-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_image_rebuild_deploy_execution_proof_blocked_gcloud_reauth_readback",
  "executionAttempt": {
    "jobName": "reeditpro-sound-cpu-analysis-worker",
    "executionName": "reeditpro-sound-cpu-analysis-worker-rdxcv",
    "created": true,
    "finalStatusRead": false,
    "logsRead": false,
    "metadataJobExecuted": false
  },
  "readbackBlocker": {
    "blocker": "gcloud_noninteractive_reauth_required",
    "activeAccount": "aiediting@reeditpro.com",
    "observedMessage": "Reauthentication failed. cannot prompt during non-interactive execution.",
    "alternateAccountChecked": "yuzastudio6@gmail.com",
    "alternateAccountResult": "authenticated_but_missing_run.executions.list_permission",
    "applicationDefaultCredentialsResult": "reauth_required"
  },
  "safeResume": {
    "firstStep": "Refresh non-interactive credentials for aiediting@reeditpro.com.",
    "secondStep": "Read execution reeditpro-sound-cpu-analysis-worker-rdxcv status and logs.",
    "rerunAllowedBeforeReadback": false,
    "rerunCondition": "Only if the execution cannot be recovered and the replacement attempt is explicitly recorded."
  },
  "notClaimed": {
    "cloudRunExecutionPassed": false,
    "allFifteenToolsPassedInCloudRun": false,
    "agentCloudToolCallPassed": false,
    "externalBetaReady": false,
    "productionReady": false
  }
}
```
