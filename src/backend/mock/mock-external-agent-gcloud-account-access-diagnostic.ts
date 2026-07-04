export type ExternalAgentGcloudAccountAccessDiagnosticCommand = {
  id: string
  command: string
  args: string[]
  purpose: string
  capturesTokenValue: false
  mutatesCloud: false
  runsInference: false
}

export const EXTERNAL_AGENT_GCLOUD_ACCOUNT_ACCESS_DIAGNOSTIC = {
  decision: 'external_agent_gcloud_account_access_diagnostic_read_only_probe_defined',
  mode: 'read_only_external_agent_gcloud_account_access_diagnostic',
  projectId: 'reeditpro',
  qwen: {
    toolId: 'qwen2_5_vl_7b_instruct',
    serviceName: 'reeditpro-qwen2-5-vl-l4-worker',
    callerJobName: 'reeditpro-qwen2-5-vl-private-caller',
    region: 'us-central1',
    requiredReadAccess: ['run.services.get', 'run.jobs.get'],
    likelyMinimalRole: 'roles/run.viewer',
    requiredResourceScope:
      'project reeditpro, region us-central1, Qwen worker service and private caller job visibility',
  },
  broll: {
    toolId: 'ai_video_broll_generation_wan',
    targetRegion: 'northamerica-northeast2',
    selectedGpu: 'nvidia_l4',
    minimumGlobalGpusAllRegionsQuota: 1,
    minimumRegionalL4Quota: 1,
    requiredReadAccess: ['compute.projects.get', 'compute.regions.get'],
    likelyMinimalRole: 'roles/compute.viewer',
    requiredResourceScope:
      'project reeditpro, region northamerica-northeast2, global GPU quota and regional L4 quota visibility',
  },
  nextActionIfAnyAccountReady:
    'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: select the redacted local gcloud account candidate with required ReEditPro read access, then rerun npm run external-agent-tool-blockers:preflight -- --account-index <account-index>',
  nextActionIfNoAccountReady:
    'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh or grant a local gcloud account Cloud Run and Compute read access for project reeditpro, then rerun npm run external-agent-tool-blockers:preflight -- --account-index <account-index>',
  postRepairCodexVerificationCommand:
    'npm run external-agent-tool-blockers:preflight -- --account-index <account-index>',
  allowedReadOnlyCommands: [
    {
      id: 'gcloud_path',
      command: 'which',
      args: ['gcloud'],
      purpose: 'locate the gcloud binary visible to this Codex shell',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_auth_list',
      command: 'gcloud',
      args: ['auth', 'list', '--format=json'],
      purpose: 'list local gcloud account metadata with account values redacted in output',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_project',
      command: 'gcloud',
      args: ['config', 'get-value', 'project'],
      purpose: 'read active project',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
  ] satisfies ExternalAgentGcloudAccountAccessDiagnosticCommand[],
  perAccountReadOnlyProbeTemplates: [
    'gcloud --account ACCOUNT auth print-access-token --quiet',
    'gcloud --account ACCOUNT run services describe SERVICE --project PROJECT --region REGION --format=value(metadata.name)',
    'gcloud --account ACCOUNT run jobs describe JOB --project PROJECT --region REGION --format=value(metadata.name)',
    'gcloud --account ACCOUNT compute project-info describe --project PROJECT --format=json',
    'gcloud --account ACCOUNT compute regions describe REGION --project PROJECT --format=json',
  ],
  runtimeSideEffects: {
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
} as const

export type ExternalAgentGcloudAccountAccessDiagnostic =
  typeof EXTERNAL_AGENT_GCLOUD_ACCOUNT_ACCESS_DIAGNOSTIC
