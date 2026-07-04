# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Job Deploy Register

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-job-deploy-register
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-job-deploy-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_image_rebuild_deploy_execution_proof_blocked_gcloud_reauth_readback",
  "project": "reeditpro",
  "region": "us-central1",
  "serviceAccount": "reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com",
  "fixedDigest": "sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366",
  "jobs": [
    {
      "jobName": "reeditpro-sound-cpu-analysis-worker",
      "image": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker@sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366",
      "ready": true,
      "cpu": "2",
      "memory": "4Gi",
      "taskCount": 1,
      "parallelism": 1,
      "maxRetries": 0,
      "timeoutSeconds": 600
    },
    {
      "jobName": "reeditpro-sound-audio-metadata-worker",
      "image": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker@sha256:0675cfce640fcee435d0e8335647bea85f2cac9d7fb44650e473da5fcfe98366",
      "ready": true,
      "cpu": "2",
      "memory": "4Gi",
      "taskCount": 1,
      "parallelism": 1,
      "maxRetries": 0,
      "timeoutSeconds": 600
    }
  ],
  "disabledEnvFlags": {
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
    "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
    "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
    "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0",
    "REEDITPRO_EXTERNAL_BETA_READY": "false",
    "REEDITPRO_PRODUCTION_READY": "false"
  },
  "executionPolicy": {
    "analysisJobExecutionCreated": "reeditpro-sound-cpu-analysis-worker-rdxcv",
    "metadataJobExecutionCreated": "no",
    "doNotRerunBeforeReadback": true
  }
}
```
