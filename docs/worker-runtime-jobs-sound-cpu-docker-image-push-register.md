# WORKER_RUNTIME_JOBS SOUND CPU Docker Image Push Register

```json worker-runtime-jobs-sound-cpu-docker-image-push-register
{
  "label": "worker-runtime-jobs-sound-cpu-docker-image-push-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan",
  "artifactRegistry": {
    "projectId": "reeditpro",
    "region": "us-central1",
    "repository": "reeditpro-workers",
    "repositoryHost": "us-central1-docker.pkg.dev",
    "dockerCredentialHelperConfigured": true
  },
  "pushedImages": [
    {
      "logicalWorker": "sound-cpu-analysis-worker",
      "image": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker",
      "tag": "source-556cd5fb5",
      "digest": "sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
      "fullyQualifiedDigest": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker@sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
      "tagReadbackPresent": true
    },
    {
      "logicalWorker": "sound-audio-metadata-worker",
      "image": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker",
      "tag": "source-556cd5fb5",
      "digest": "sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
      "fullyQualifiedDigest": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker@sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
      "tagReadbackPresent": true
    }
  ],
  "cloudRunJobsReadback": {
    "soundCpuAnalysisWorkerJobPresent": false,
    "soundAudioMetadataWorkerJobPresent": false,
    "deploymentDeferredToNextGate": true,
    "executionDeferredToLaterGate": true
  }
}
```
