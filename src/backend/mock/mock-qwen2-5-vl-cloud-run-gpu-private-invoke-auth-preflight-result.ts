export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_AUTH_PREFLIGHT_RESULT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'private_invoke_auth_preflight_result',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_private_invoke_auth_preflight_blocked_gcloud_reauth_no_invocation',
  preflight: {
    mode: 'read_only_private_invoke_auth_preflight',
    gcloudVersionChecked: true,
    projectConfigRead: true,
    activeProject: 'reeditpro',
    authListRead: true,
    configListRead: true,
    environmentTagWarningEmitted: true,
    cloudRunServiceDescribeAttempted: true,
    cloudRunIamPolicyReadAttempted: true,
    runtimeServiceAccountDescribeAttempted: true,
    projectInvokerPolicyReadAttempted: true,
    blockedReason: 'gcloud_auth_session_requires_interactive_reauthentication',
    interactiveAuthRun: false
  },
  target: {
    project: 'reeditpro',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    runtimeIdentity: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  },
  requiredEvidenceStillMissing: [
    'cloud_run_service_describe',
    'cloud_run_service_iam_policy',
    'approved_backend_caller_identity',
    'minimal_cloud_run_invoker_grant',
    'runtime_service_account_enabled',
    'no_unauthenticated_invoker_binding',
    'restricted_ingress_confirmed'
  ],
  runtimeFlags: {
    privateInvokeAuthPreflightAttempted: true,
    gcloudAvailable: true,
    gcloudProjectVerified: true,
    gcloudAuthListRead: true,
    gcloudConfigListRead: true,
    cloudRunServiceDescribeSucceeded: false,
    cloudRunIamPolicyReadSucceeded: false,
    runtimeServiceAccountDescribeSucceeded: false,
    projectInvokerPolicyReadSucceeded: false,
    authSessionRequiresReauthentication: true,
    privateInvokeAuthPreflightPassed: false,
    readyForPrivateInvocation: false,
    interactiveAuthRun: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    iamBindingCreated: false,
    serviceAccountKeyCreated: false,
    dispatchSubmitted: false,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    promptProcessed: false,
    forwardPassRun: false,
    inferenceRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_38-BLOCKED-GCLOUD-REAUTH: refresh gcloud auth session for read-only IAM preflight, no invocation'
} as const

export type Qwen25VlCloudRunGpuPrivateInvokeAuthPreflightResult =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_AUTH_PREFLIGHT_RESULT
