# WORKER_RUNTIME_JOBS SOUND CPU Cloud Run Job Deployment Result

```json worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-result
{
  "label": "worker-runtime-jobs-sound-cpu-cloud-run-job-deployment-result",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_cloud_run_job_deployment_result_completed_with_blockers_ready_for_controlled_cloud_run_no_media_execution_proof",
  "sourceEvidence": {
    "sourceBranch": "codex/rp-model-orchestration-plan-snapshot-dry-run-validation",
    "sourceHead": "f80db3f414fd0b896d357a12ab893f1341d73b11",
    "sourcePr": 2413,
    "sourcePrTitle": "[workers] SOUND CPU Docker image build push result",
    "sourceMergeCommit": "f80db3f414fd0b896d357a12ab893f1341d73b11",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan"
  },
  "boundedGoogleCloudMutation": {
    "projectId": "reeditpro",
    "region": "us-central1",
    "cloudRunDeploymentExecuted": true,
    "cloudRunJobExecuted": false,
    "dockerBuildExecutedForAmd64Fix": true,
    "dockerPushExecutedForAmd64Fix": true,
    "dockerRunExecuted": false,
    "workerExecutionEnabled": false,
    "routeExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "supabaseMutationEnabled": false,
    "artifactWriteEnabled": false,
    "externalBetaUnlocked": false,
    "productionUnlocked": false
  },
  "deploymentResult": {
    "analysisJobReady": true,
    "metadataJobReady": true,
    "analysisJobExecutionCount": 0,
    "metadataJobExecutionCount": 0,
    "analysisJobUid": "0325edad-f27c-4a11-a2fe-879f0c032ba7",
    "metadataJobUid": "514b1e9a-7da4-4973-8f0c-572d66a79f66",
    "analysisObservedGeneration": 2,
    "metadataObservedGeneration": 1,
    "analysisLastUpdatedTime": "2026-07-04T04:10:11.579750Z",
    "metadataLastUpdatedTime": "2026-07-04T04:10:15.093026Z"
  },
  "imageArchitectureCorrection": {
    "initialTag": "source-556cd5fb5",
    "initialDigest": "sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b",
    "initialManifestPlatform": "linux/arm64",
    "initialCloudRunReady": false,
    "correction": "rebuilt and pushed explicit linux/amd64 images with provenance and sbom disabled",
    "correctedTag": "source-f80db3f41-amd64",
    "correctedDigest": "sha256:00e534546735201494c980557f89eabfce5dd2c6ecab8103b085cc90a9ec9b1d",
    "correctedManifestMediaType": "application/vnd.docker.distribution.manifest.v2+json",
    "correctedCloudRunReady": true
  },
  "result": {
    "allFifteenToolsImageInstalledInCloudRunDigest": true,
    "soundCpuAnalysisCloudRunJobExists": true,
    "soundAudioMetadataCloudRunJobExists": true,
    "cloudRunControlledExecutionPassed": false,
    "agentCloudToolCallPassed": false,
    "externalBetaReadyNow": false
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-CLOUD-RUN-NO-MEDIA-EXECUTION-PROOF: prove controlled SOUND CPU Cloud Run execution, no media"
}
```

Both SOUND CPU Cloud Run Jobs now exist and are Ready with disabled runtime, media, Supabase, artifact, beta, and production flags. No Cloud Run Job execution was started in this gate.
