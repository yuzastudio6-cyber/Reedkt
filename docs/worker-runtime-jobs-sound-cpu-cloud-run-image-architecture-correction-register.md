# WORKER_RUNTIME_JOBS SOUND CPU Cloud Run Image Architecture Correction Register

```json worker-runtime-jobs-sound-cpu-cloud-run-image-architecture-correction-register
{
  "label": "worker-runtime-jobs-sound-cpu-cloud-run-image-architecture-correction-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_cloud_run_job_deployment_result_completed_with_blockers_ready_for_controlled_cloud_run_no_media_execution_proof",
  "initialFailedDeployment": {
    "jobName": "reeditpro-sound-cpu-analysis-worker",
    "imageDigest": "sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
    "manifestType": "application/vnd.oci.image.index.v1+json",
    "manifestPlatform": "linux/arm64",
    "cloudRunMessage": "Container manifest type application/vnd.oci.image.index.v1+json must support amd64/linux.",
    "jobExecuted": false
  },
  "correctedBuildPush": {
    "tag": "source-f80db3f41-amd64",
    "platform": "linux/amd64",
    "provenanceEnabled": false,
    "sbomEnabled": false,
    "digest": "sha256:00e534546735201494c980557f89eabfce5dd2c6ecab8103b085cc90a9ec9b1d",
    "manifestMediaType": "application/vnd.docker.distribution.manifest.v2+json",
    "allThirteenPinnedPackagesInstalled": true,
    "aliasCoveredToolCount": 2
  },
  "correctedDeployment": {
    "analysisJobReady": true,
    "metadataJobReady": true,
    "cloudRunJobExecutionStarted": false
  }
}
```
