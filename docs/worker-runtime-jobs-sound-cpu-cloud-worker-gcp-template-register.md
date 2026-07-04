# WORKER_RUNTIME_JOBS SOUND CPU Cloud Worker GCP Template Register

```json worker-runtime-jobs-sound-cpu-cloud-worker-gcp-template-register
{
  "label": "worker-runtime-jobs-sound-cpu-cloud-worker-gcp-template-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_cloud_worker_runtime_plan_completed_with_warnings_ready_for_cloud_worker_runtime_owner_review_no_deploy",
  "gcpTemplates": {
    "configFile": "server/config/gcp-production-config.ts",
    "cloudRunJobs": [
      {
        "jobName": "reeditpro-sound-cpu-analysis-worker",
        "imageName": "reeditpro-sound-cpu-analysis-worker",
        "serviceAccountKey": "cpu_analysis_worker",
        "cpu": 2,
        "memory": "4Gi",
        "gpu": "none",
        "parallelism": 1,
        "maxRetries": 0,
        "deployScript": "scripts/gcp/prod/09a-deploy-sound-cpu-analysis-worker-job.example.sh"
      },
      {
        "jobName": "reeditpro-sound-audio-metadata-worker",
        "imageName": "reeditpro-sound-audio-metadata-worker",
        "serviceAccountKey": "cpu_analysis_worker",
        "cpu": 2,
        "memory": "4Gi",
        "gpu": "none",
        "parallelism": 1,
        "maxRetries": 0,
        "deployScript": "scripts/gcp/prod/09b-deploy-sound-audio-metadata-worker-job.example.sh"
      }
    ],
    "dockerBuildExamples": [
      "scripts/docker/prod/02a-build-sound-cpu-analysis-worker-image.example.sh",
      "scripts/docker/prod/02b-build-sound-audio-metadata-worker-image.example.sh"
    ],
    "runtimeDisabledEnvVars": [
      "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED=0",
      "REEDITPRO_WORKER_EXECUTION_ENABLED=0",
      "REEDITPRO_MEDIA_PROCESSING_ENABLED=0",
      "REEDITPRO_SUPABASE_MUTATION_ENABLED=0",
      "REEDITPRO_ARTIFACT_WRITE_ENABLED=0"
    ],
    "artifactRegistryImages": [
      "REGION-docker.pkg.dev/PROJECT/reeditpro-workers/reeditpro-sound-cpu-analysis-worker:TAG",
      "REGION-docker.pkg.dev/PROJECT/reeditpro-workers/reeditpro-sound-audio-metadata-worker:TAG"
    ]
  }
}
```

The templates are intended for a later explicit deployment gate only. They are not proof that the images were pushed, Cloud Run jobs were deployed, or workers executed in Google Cloud.
