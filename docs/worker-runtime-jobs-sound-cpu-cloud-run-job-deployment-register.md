# WORKER_RUNTIME_JOBS SOUND CPU Cloud Run Job Deployment Register

```json worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-register
{
  "label": "worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_cloud_run_job_deployment_result_completed_with_blockers_ready_for_controlled_cloud_run_no_media_execution_proof",
  "jobs": [
    {
      "jobName": "reeditpro-sound-cpu-analysis-worker",
      "ready": true,
      "image": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker@sha256:00e534546735201494c980557f89eabfce5dd2c6ecab8103b085cc90a9ec9b1d",
      "serviceAccount": "reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com",
      "cpu": "2",
      "memory": "4Gi",
      "taskCount": 1,
      "parallelism": 1,
      "maxRetries": 0,
      "timeoutSeconds": "600",
      "executionCount": 0,
      "runtimeDisabledEnvFlags": {
        "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
        "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
        "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
        "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
        "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0",
        "REEDITPRO_EXTERNAL_BETA_READY": "false",
        "REEDITPRO_PRODUCTION_READY": "false"
      }
    },
    {
      "jobName": "reeditpro-sound-audio-metadata-worker",
      "ready": true,
      "image": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker@sha256:00e534546735201494c980557f89eabfce5dd2c6ecab8103b085cc90a9ec9b1d",
      "serviceAccount": "reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com",
      "cpu": "2",
      "memory": "4Gi",
      "taskCount": 1,
      "parallelism": 1,
      "maxRetries": 0,
      "timeoutSeconds": "600",
      "executionCount": 0,
      "runtimeDisabledEnvFlags": {
        "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
        "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
        "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0",
        "REEDITPRO_SUPABASE_MUTATION_ENABLED": "0",
        "REEDITPRO_ARTIFACT_WRITE_ENABLED": "0",
        "REEDITPRO_EXTERNAL_BETA_READY": "false",
        "REEDITPRO_PRODUCTION_READY": "false"
      }
    }
  ],
  "labels": {
    "lane": "sound-cpu",
    "execution": "disabled",
    "media": "disabled"
  }
}
```
