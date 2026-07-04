export type ExternalAgentGcpAccessRepairPermission = {
  permission: string
  purpose: string
}

export type ExternalAgentGcpAccessRepairTool = {
  toolId: 'qwen2_5_vl_7b_instruct' | 'ai_video_broll_generation_wan'
  blocker: string
  requiredReadPermissions: ExternalAgentGcpAccessRepairPermission[]
  likelyMinimalRole: string
  requiredResourceScope: string
  verificationCommand: string
  runtimeExecutionStillRequiresWrapperGate: true
}

export const EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN = {
  decision: 'external_agent_gcp_access_repair_plan_defined_no_mutation',
  mode: 'external_agent_gcp_access_repair_plan_only',
  projectId: 'reeditpro',
  accountSelection: {
    overrideEnv: 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT',
    overrideIndexEnv: 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX',
    usesCloudSdkCoreAccountForChildCommandsOnly: true,
    mutatesLocalGcloudConfig: false,
    printsAccountValue: false,
    tokenStdoutSuppressed: true,
  },
  currentLiveBlockers: [
    'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing',
    'gcloud_account_lacks_compute_quota_read_access',
  ],
  repairScope: {
    repairsOnlyLocalAccountReadVisibility: true,
    doesNotGrantIam: true,
    doesNotCreateServiceAccounts: true,
    doesNotCreateServiceAccountKeys: true,
    doesNotMutateGcp: true,
    doesNotAuthorizeRuntimeExecution: true,
  },
  tools: [
    {
      toolId: 'qwen2_5_vl_7b_instruct',
      blocker: 'gcloud_account_lacks_qwen_cloud_run_read_access_or_resources_missing',
      requiredReadPermissions: [
        {
          permission: 'run.services.get',
          purpose: 'read the Qwen Cloud Run worker service before private approved-fixture invocation',
        },
        {
          permission: 'run.jobs.get',
          purpose: 'read the Qwen private caller job before any guarded wrapper delegation',
        },
      ],
      likelyMinimalRole: 'roles/run.viewer',
      requiredResourceScope:
        'project reeditpro, region us-central1, Qwen worker service and private caller job visibility',
      verificationCommand:
        'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-tool-blockers:preflight',
      runtimeExecutionStillRequiresWrapperGate: true,
    },
    {
      toolId: 'ai_video_broll_generation_wan',
      blocker: 'gcloud_account_lacks_compute_quota_read_access',
      requiredReadPermissions: [
        {
          permission: 'compute.projects.get',
          purpose: 'read project-level GPUS_ALL_REGIONS quota before any B-roll VM proof',
        },
        {
          permission: 'compute.regions.get',
          purpose: 'read regional NVIDIA_L4_GPUS quota before any B-roll VM proof',
        },
      ],
      likelyMinimalRole: 'roles/compute.viewer',
      requiredResourceScope:
        'project reeditpro, region northamerica-northeast2, global GPU quota and regional L4 quota visibility',
      verificationCommand:
        'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-tool-blockers:preflight',
      runtimeExecutionStillRequiresWrapperGate: true,
    },
  ] satisfies ExternalAgentGcpAccessRepairTool[],
  postRepairVerificationCommands: [
    'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-tool-blockers:preflight',
    'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX=<redacted-index> npm run external-agent-tool-next-command',
  ],
  runtimeSideEffects: {
    iamPolicyMutated: false,
    cloudRunServiceMutated: false,
    cloudRunJobExecuted: false,
    computeVmCreated: false,
    quotaRequestCreated: false,
    dockerRun: false,
    modelImportRun: false,
    modelInferenceRun: false,
    generatedVideoCreated: false,
    generatedAssetsCreated: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    storageObjectsCreated: false,
    signedUrlsCreated: false,
    publicArtifactsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
  },
  recommendedNextPrompt:
    'QWEN2_5_VL_STACK_TOOL_58DQ-GCP-ACCESS-VERIFY: verify selected local gcloud account can read Qwen Cloud Run and B-roll quota, no execution',
} as const

export type ExternalAgentGcpAccessRepairPlan = typeof EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN
