# WORKER_RUNTIME_JOBS SOUND CPU GCP Resource Readback Register

```json worker-runtime-jobs-sound-cpu-gcp-resource-readback-register
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-resource-readback-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_read_only_gcp_preflight_completed_with_blockers_ready_for_foundation_resource_creation_plan",
  "commands": {
    "projectDescribe": "gcloud projects describe reeditpro --format=json",
    "enabledApisNarrowList": "gcloud services list --enabled --project=reeditpro --filter=\"config.name:(run.googleapis.com OR artifactregistry.googleapis.com OR iam.googleapis.com OR cloudbuild.googleapis.com OR secretmanager.googleapis.com OR containerscanning.googleapis.com OR cloudresourcemanager.googleapis.com)\" --format=\"value(config.name)\"",
    "artifactRepositoryDescribe": "gcloud artifacts repositories describe reeditpro-workers --location=us-central1 --project=reeditpro --format=json",
    "cpuServiceAccountDescribe": "gcloud iam service-accounts describe reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com --project=reeditpro --format=json",
    "soundImagesList": "gcloud artifacts docker images list us-central1-docker.pkg.dev/reeditpro/reeditpro-workers --include-tags --project=reeditpro --filter=\"package:(reeditpro-sound-cpu-analysis-worker OR reeditpro-sound-audio-metadata-worker)\" --format=json",
    "cloudRunJobsDescribe": "gcloud run jobs describe reeditpro-sound-cpu-analysis-worker / reeditpro-sound-audio-metadata-worker --region=us-central1 --project=reeditpro --format=json"
  },
  "project": {
    "projectId": "reeditpro",
    "projectNumber": "390722338345",
    "lifecycleState": "ACTIVE",
    "organizationId": "622755361329",
    "environmentTag": "missing_or_unverified",
    "environmentTagWarning": "Project 'reeditpro' lacks an 'environment' tag."
  },
  "enabledApisObserved": [
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com"
  ],
  "enabledApisNotObserved": [
    "containerscanning.googleapis.com"
  ],
  "artifactRepository": {
    "exists": true,
    "name": "projects/reeditpro/locations/us-central1/repositories/reeditpro-workers",
    "registryUri": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers",
    "format": "DOCKER",
    "mode": "STANDARD_REPOSITORY",
    "sizeReadback": "249.425MB",
    "vulnerabilityScanningEnablementState": "SCANNING_DISABLED",
    "vulnerabilityScanningReason": "API containerscanning.googleapis.com is not enabled."
  },
  "serviceAccounts": {
    "reeditproCpuWorkerSaExists": false,
    "expectedEmail": "reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com"
  },
  "artifactImages": {
    "reeditproSoundCpuAnalysisWorkerExists": false,
    "reeditproSoundAudioMetadataWorkerExists": false,
    "listResultCount": 0
  },
  "cloudRunJobs": {
    "reeditproSoundCpuAnalysisWorkerExists": false,
    "reeditproSoundAudioMetadataWorkerExists": false,
    "notFoundMessages": [
      "Cannot find job [reeditpro-sound-cpu-analysis-worker].",
      "Cannot find job [reeditpro-sound-audio-metadata-worker]."
    ]
  }
}
```

This register intentionally records only sanitized resource existence and status readbacks. It contains no credentials, secret values, signed URLs, media paths, provider outputs, or service-role payloads.
