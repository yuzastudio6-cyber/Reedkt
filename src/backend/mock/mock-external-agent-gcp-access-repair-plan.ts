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
  failureMeaning: string
  safeRepairChecklist: string[]
  unsafeBypasses: string[]
  runtimeExecutionStillRequiresWrapperGate: true
}

export const EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN = {
  decision: 'external_agent_gcp_access_repair_plan_defined_no_mutation',
  mode: 'external_agent_gcp_access_repair_plan_only',
  projectId: 'reeditpro',
  accountSelection: {
    overrideEnv: 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT',
    overrideIndexEnv: 'REEDITPRO_EXTERNAL_AGENT_GCLOUD_ACCOUNT_INDEX',
    overrideIndexCliFlag: '--account-index',
    overrideIndexCliFlagAlias: '--gcloud-account-index',
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
        'npm run external-agent-tool-blockers:preflight -- --account-index <redacted-index>',
      failureMeaning:
        'Token refresh can pass while the selected account still cannot read the Qwen Cloud Run service or private caller job; this usually means missing Cloud Run viewer access or missing expected resources.',
      safeRepairChecklist: [
        'select a local gcloud account that is intended to read project reeditpro Qwen Cloud Run resources',
        'ask the GCP owner to confirm the Qwen service and private caller job exist in us-central1',
        'ask the GCP owner to grant or confirm read-only Cloud Run visibility for the selected account',
        'rerun the redacted account-index preflight before any wrapper execution attempt',
      ],
      unsafeBypasses: [
        'do not skip Cloud Run service/job describe checks',
        'do not run the Qwen wrapper from raw chat or without the explicit confirmation env',
        'do not create replacement Cloud Run resources from the external-agent gate',
      ],
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
        'npm run external-agent-tool-blockers:preflight -- --account-index <redacted-index>',
      failureMeaning:
        'The selected account cannot read project or regional Compute quota, so the agent cannot prove L4 availability before any no-idle VM proof.',
      safeRepairChecklist: [
        'select a local gcloud account that is intended to read project reeditpro Compute quota',
        'ask the GCP owner to grant or confirm read-only Compute project and region visibility',
        'verify GPUS_ALL_REGIONS and regional NVIDIA_L4_GPUS quota before any VM create path',
        'rerun the redacted account-index preflight before any bounded B-roll wrapper execution attempt',
      ],
      unsafeBypasses: [
        'do not create a VM before quota read checks pass',
        'do not request quota from the external-agent wrapper',
        'do not switch to an always-on GPU instance to bypass no-idle gating',
      ],
      runtimeExecutionStillRequiresWrapperGate: true,
    },
  ] satisfies ExternalAgentGcpAccessRepairTool[],
  failureResponsePolicy: {
    ifTokenRefreshFails: 'refresh local auth or select another redacted account index; do not mutate project IAM from this tool',
    ifReadAccessFails:
      'treat it as external GCP access or resource visibility work; do not weaken wrapper gates or mark runtime executable',
    ifQuotaInsufficient:
      'keep B-roll runtime blocked until read-only quota verification proves one L4 VM can be created and cleaned up',
    ifResourcesAreMissing:
      'stop at diagnosis and hand off to the owning infrastructure path; do not create replacement resources from this repair plan',
  },
  safeRetryChecklist: [
    'run npm run external-agent-gcloud-account-access:diagnostic to find a redacted account index candidate',
    'run npm run external-agent-gcp-access:verify -- --account-index <redacted-index>',
    'run npm run external-agent-tool-blockers:preflight -- --account-index <redacted-index>',
    'run npm run external-agent-tool-next-command -- --account-index <redacted-index>',
    'execute only the emitted guarded wrapper whose executionAllowedNow field is true',
  ],
  postRepairVerificationCommands: [
    'npm run external-agent-gcp-access:verify -- --account-index <redacted-index>',
    'npm run external-agent-tool-blockers:preflight -- --account-index <redacted-index>',
    'npm run external-agent-tool-next-command -- --account-index <redacted-index>',
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
