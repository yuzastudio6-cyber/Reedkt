# Qwen2.5-VL 7B Cloud Run GPU Fail-closed Deploy Result Change Log

```json qwen2-5-vl-7b-cloud-run-gpu-fail-closed-deploy-result-change-log
{
  "decision": "qwen2_5_vl_7b_cloud_run_gpu_fail_closed_service_deployed_no_model_import_no_inference",
  "service": {
    "project": "reeditpro",
    "region": "us-central1",
    "name": "reeditpro-qwen2-5-vl-l4-worker",
    "revision": "reeditpro-qwen2-5-vl-l4-worker-00001-t88",
    "operationId": "ab759df5-4fe9-4a33-bbe7-e0c0963b8bbe",
    "serviceUrlPresent": true,
    "serviceUrlRedactedInRepoEvidence": true,
    "ready": true,
    "latestReadyRevision": "reeditpro-qwen2-5-vl-l4-worker-00001-t88",
    "trafficPercent": 100
  },
  "image": {
    "digest": "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630",
    "fullyQualifiedDigest": "us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/qwen2-5-vl-7b-cloud-run-gpu@sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630"
  },
  "revisionReadiness": {
    "revisionReady": true,
    "deployDuration": "7m13.87s",
    "containerImageImportCompleted": true,
    "containerImageImportDuration": "7m11.18s",
    "importedContainerProvisioningDuration": "1.84s"
  },
  "runtimeShape": {
    "runtimeIdentity": "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    "gpuType": "nvidia-l4",
    "gpuCount": 1,
    "cpu": 8,
    "memory": "32Gi",
    "minInstances": 0,
    "maxInstances": 1,
    "concurrency": 1,
    "timeoutSeconds": 900,
    "deployHealthCheckDisabled": true,
    "cpuThrottlingDisabled": true,
    "gpuZonalRedundancyDisabled": true,
    "ingress": "internal-and-cloud-load-balancing",
    "publicUnauthenticatedAccessAllowed": false
  },
  "mount": {
    "volumeName": "qwen-model-cache",
    "driver": "gcsfuse.run.googleapis.com",
    "bucket": "reeditpro-staging-reeditpro-generated-assets",
    "readOnly": true,
    "mountPath": "/models/qwen2.5-vl-7b-instruct",
    "mountOptions": "only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/,implicit-dirs",
    "runtimeDataPlaneReadProofStillRequired": true
  },
  "iam": {
    "policyBindingsPresent": false,
    "allUsersInvokerBindingPresent": false,
    "allAuthenticatedUsersInvokerBindingPresent": false
  },
  "runtimeFlags": {
    "cloudRunDeployCommandExecuted": true,
    "cloudRunServiceCreated": true,
    "cloudRunRevisionReady": true,
    "cloudRunVolumeMountCreated": true,
    "artifactRegistryImageCreated": true,
    "minInstancesZero": true,
    "maxInstancesOne": true,
    "publicUnauthenticatedAccessAllowed": false,
    "ingressAllAllowed": false,
    "deployHealthCheckDisabled": true,
    "runtimeRequestSent": false,
    "modelImportRun": false,
    "modelLoadRun": false,
    "modelInferenceRun": false,
    "apiServerInvoked": false,
    "providerCallsMade": false,
    "workersDispatched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "publicArtifactsCreated": false,
    "signedUrlsCreated": false,
    "creditMutationCreated": false,
    "betaUnlocked": false,
    "productionUnlocked": false,
    "dryRunPassedClaimed": false,
    "generatedLocalFixturePassedClaimed": false
  },
  "nextPrompt": "QWEN2_5_VL_STACK_TOOL_25-CLOUD-RUN-GPU-PRIVATE-MOUNT-READ-PROOF: verify fail-closed Cloud Run service mount/readiness, no model import/no inference"
}
```
