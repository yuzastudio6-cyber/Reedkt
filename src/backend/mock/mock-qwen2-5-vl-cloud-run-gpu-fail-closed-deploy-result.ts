export const QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DEPLOY_RESULT = {
  workstream: "AI_VIDEO_BROLL_GENERATION",
  toolId: "qwen2_5_vl_7b_instruct",
  mode: "cloud_run_gpu_fail_closed_deploy_result",
  decision:
    "qwen2_5_vl_7b_cloud_run_gpu_fail_closed_service_deployed_no_model_import_no_inference",
  service: {
    project: "reeditpro",
    region: "us-central1",
    name: "reeditpro-qwen2-5-vl-l4-worker",
    revision: "reeditpro-qwen2-5-vl-l4-worker-00001-t88",
    operationId: "ab759df5-4fe9-4a33-bbe7-e0c0963b8bbe",
    serviceUrlPresent: true,
    serviceUrlRedactedInRepoEvidence: true,
    ready: true,
    latestReadyRevision: "reeditpro-qwen2-5-vl-l4-worker-00001-t88",
    trafficPercent: 100
  },
  image: {
    digest: "sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630",
    fullyQualifiedDigest:
      "us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/qwen2-5-vl-7b-cloud-run-gpu@sha256:572acc29405cee48a42baf98f39d949915b8ef14df638736b886673efc47b630"
  },
  revisionReadiness: {
    revisionReady: true,
    deployDuration: "7m13.87s",
    containerImageImportCompleted: true,
    containerImageImportDuration: "7m11.18s",
    importedContainerProvisioningDuration: "1.84s"
  },
  runtimeShape: {
    runtimeIdentity: "reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com",
    gpuType: "nvidia-l4",
    gpuCount: 1,
    cpu: 8,
    memory: "32Gi",
    minInstances: 0,
    maxInstances: 1,
    concurrency: 1,
    timeoutSeconds: 900,
    deployHealthCheckDisabled: true,
    cpuThrottlingDisabled: true,
    gpuZonalRedundancyDisabled: true,
    ingress: "internal-and-cloud-load-balancing",
    publicUnauthenticatedAccessAllowed: false,
    backendOnlyInvocationRequired: true
  },
  mount: {
    volumeName: "qwen-model-cache",
    driver: "gcsfuse.run.googleapis.com",
    bucket: "reeditpro-staging-reeditpro-generated-assets",
    readOnly: true,
    mountPath: "/models/qwen2.5-vl-7b-instruct",
    mountOptions:
      "only-dir=model-weights/vlm/qwen2.5-vl-7b-instruct/cc594898137f460bfe9f0759e9844b3ce807cfb5/,implicit-dirs",
    runtimeDataPlaneReadProofStillRequired: true,
    modelImportThroughMountAttempted: false
  },
  failClosedEnvironment: {
    HF_HUB_OFFLINE: "1",
    TRANSFORMERS_OFFLINE: "1",
    HF_HUB_DISABLE_TELEMETRY: "1",
    MODEL_DOWNLOADS_ENABLED: "false",
    RAW_VLM_PROMPT_ENABLED: "false",
    PROVIDER_EXECUTION_ENABLED: "false",
    MEDIA_PROCESSING_ENABLED: "false",
    REAL_MEDIA_INPUT_ENABLED: "false",
    ARBITRARY_MEDIA_INPUT_ENABLED: "false",
    PUBLIC_OUTPUT_ENABLED: "false",
    TRACK_A_EXECUTION_ENABLED: "false",
    QWEN_APPROVED_SNAPSHOT_REQUIRED: "true",
    QWEN_QUEUE_LEASE_REQUIRED: "true",
    QWEN_MODEL_IMPORT_ON_STARTUP: "false",
    QWEN_INFERENCE_ENABLED: "false",
    QWEN_MODEL_CACHE_MOUNT: "/models/qwen2.5-vl-7b-instruct",
    QWEN_MODEL_REVISION: "cc594898137f460bfe9f0759e9844b3ce807cfb5",
    QWEN_MODEL_AGGREGATE_SHA256:
      "46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b"
  },
  iam: {
    policyBindingsPresent: false,
    allUsersInvokerBindingPresent: false,
    allAuthenticatedUsersInvokerBindingPresent: false
  },
  runtimeFlags: {
    cloudRunDeployCommandExecuted: true,
    cloudRunServiceCreated: true,
    cloudRunRevisionReady: true,
    cloudRunVolumeMountCreated: true,
    artifactRegistryImageCreated: true,
    minInstancesZero: true,
    maxInstancesOne: true,
    publicUnauthenticatedAccessAllowed: false,
    ingressAllAllowed: false,
    deployHealthCheckDisabled: true,
    runtimeRequestSent: false,
    modelImportRun: false,
    modelLoadRun: false,
    modelInferenceRun: false,
    apiServerInvoked: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false
  },
  nextPrompt:
    "QWEN2_5_VL_STACK_TOOL_25-CLOUD-RUN-GPU-PRIVATE-MOUNT-READ-PROOF: verify fail-closed Cloud Run service mount/readiness, no model import/no inference"
} as const;

export type Qwen25VlCloudRunGpuFailClosedDeployResult =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_FAIL_CLOSED_DEPLOY_RESULT;
