# WORKER_RUNTIME_JOBS SOUND CPU Docker Image Build Push Result

```json worker-runtime-jobs-sound-cpu-docker-image-build-push-result
{
  "label": "worker-runtime-jobs-sound-cpu-docker-image-build-push-result",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan",
  "sourceEvidence": {
    "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "sourceHead": "556cd5fb538379ebbecf58fde92a9034d836931c",
    "sourcePr": 2411,
    "sourcePrTitle": "[workers] SOUND CPU GCP IAM binding result",
    "sourceMergeCommit": "556cd5fb538379ebbecf58fde92a9034d836931c",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_gcp_iam_role_binding_result_completed_with_blockers_ready_for_docker_image_build_push_plan"
  },
  "boundedDockerAndRegistryMutation": {
    "dockerVersion": "29.5.2",
    "dockerDesktopDaemonAvailable": true,
    "dockerBuildExecuted": true,
    "dockerPushExecuted": true,
    "dockerRunExecuted": false,
    "cloudRunDeploymentExecuted": false,
    "cloudRunJobExecuted": false,
    "gcpCloudRunExecutionEnabled": false,
    "workerExecutionEnabled": false,
    "routeExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "supabaseMutationEnabled": false,
    "artifactWriteEnabled": false,
    "externalBetaUnlocked": false,
    "productionUnlocked": false
  },
  "imageResult": {
    "tag": "source-556cd5fb5",
    "analysisImage": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker:source-556cd5fb5",
    "metadataImage": "us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker:source-556cd5fb5",
    "analysisDigest": "sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
    "metadataDigest": "sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
    "localImageId": "sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
    "localImageSizeBytes": 510782338,
    "artifactRegistryTagsPresent": true,
    "artifactRegistryDigestsPresent": true,
    "cloudRunJobsPresent": false
  },
  "toolInstallEvidence": {
    "directPinnedPackageCount": 13,
    "directPinnedPackages": [
      "librosa",
      "audioread",
      "pydub",
      "scipy",
      "resampy",
      "pyloudnorm",
      "audioflux",
      "music21",
      "pretty_midi",
      "mido",
      "noisereduce",
      "pedalboard",
      "mir_eval"
    ],
    "aliasCoveredTools": [
      "pydub_effects",
      "ebu_r128_pyloudnorm"
    ],
    "allFifteenToolsImageInstalled": true,
    "allFifteenToolsCloudExecutableNow": false
  },
  "result": {
    "soundCpuAnalysisImagePushed": true,
    "soundAudioMetadataImagePushed": true,
    "soundCpuAnalysisCloudRunJobExists": false,
    "soundAudioMetadataCloudRunJobExists": false,
    "cloudRunControlledExecutionPassed": false,
    "agentCloudToolCallPassed": false,
    "externalBetaReadyNow": false
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-CLOUD-RUN-JOB-DEPLOYMENT-PLAN: deploy SOUND CPU Cloud Run Jobs, no job execution"
}
```

The two SOUND CPU image tags now exist in Artifact Registry with the same immutable digest. This closes the image-build and image-push blocker, but it does not claim Cloud Run deployment, Cloud Run execution, agent cloud execution, external beta readiness, or production readiness.
