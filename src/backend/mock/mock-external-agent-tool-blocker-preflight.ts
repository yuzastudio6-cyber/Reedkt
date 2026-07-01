export type ExternalAgentToolBlockerPreflightCommand = {
  id: string
  toolId: 'qwen2_5_vl_7b_instruct' | 'ai_video_broll_generation_wan'
  command: string
  args: string[]
  purpose: string
  capturesTokenValue: false
  mutatesCloud: false
  runsInference: false
}

export const EXTERNAL_AGENT_TOOL_BLOCKER_PREFLIGHT = {
  decision: 'external_agent_tool_blocker_preflight_read_only_probe_defined',
  mode: 'read_only_external_agent_tool_blocker_preflight',
  projectId: 'reeditpro',
  qwen: {
    toolId: 'qwen2_5_vl_7b_instruct',
    serviceName: 'reeditpro-qwen2-5-vl-l4-worker',
    callerJobName: 'reeditpro-qwen2-5-vl-private-caller',
    region: 'us-central1',
    blockerIfFailed: 'local_gcloud_reauthentication_required',
    nextActionIfBlocked:
      'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight',
    nextActionIfCleared:
      'QWEN2_5_VL_STACK_TOOL_58DU-PRIVATE-INFERENCE-RETRY-ATTEMPT: run one bounded approved-fixture private inference retry through the persisted job and lease bridge, no generated assets/no mutation',
  },
  broll: {
    toolId: 'ai_video_broll_generation_wan',
    targetRegion: 'us-central1',
    targetZone: 'us-central1-b',
    selectedGpu: 'nvidia_l4',
    minimumGlobalGpusAllRegionsQuota: 1,
    minimumRegionalL4Quota: 1,
    blockerIfSkippedForAuth: 'quota_probe_skipped_auth_refresh_failed',
    blockerIfFailed: 'gpus_all_regions_quota_zero_or_unverified',
    nextActionIfSkippedForAuth:
      'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight',
    nextActionIfBlocked:
      'AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-USER: request GPUS_ALL_REGIONS quota increase to 1 in Google Cloud Console, no repo changes',
    nextActionIfCleared:
      'AI-VIDEO-BROLL-GEN-9J-GPU-GLOBAL-QUOTA-VERIFY: verify GPUS_ALL_REGIONS quota increase, no VM/no inference',
  },
  allowedReadOnlyCommands: [
    {
      id: 'gcloud_path',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'which',
      args: ['gcloud'],
      purpose: 'locate local gcloud binary',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_version',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'gcloud',
      args: ['--version'],
      purpose: 'read local gcloud version',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_project',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'gcloud',
      args: ['config', 'get-value', 'project'],
      purpose: 'read active project',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_active_account',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'gcloud',
      args: ['auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'],
      purpose: 'read active account domain without storing token values',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_access_token_refresh_suppressed',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'gcloud',
      args: ['auth', 'print-access-token', '--quiet'],
      purpose: 'verify non-interactive token refresh while suppressing token stdout',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'qwen_cloud_run_service_describe',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'gcloud',
      args: [
        'run',
        'services',
        'describe',
        'reeditpro-qwen2-5-vl-l4-worker',
        '--project',
        'reeditpro',
        '--region',
        'us-central1',
        '--format=value(metadata.name)',
      ],
      purpose: 'read Cloud Run service existence without invoking or mutating it',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'qwen_cloud_run_job_describe',
      toolId: 'qwen2_5_vl_7b_instruct',
      command: 'gcloud',
      args: [
        'run',
        'jobs',
        'describe',
        'reeditpro-qwen2-5-vl-private-caller',
        '--project',
        'reeditpro',
        '--region',
        'us-central1',
        '--format=value(metadata.name)',
      ],
      purpose: 'read Cloud Run caller job existence without executing it',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'broll_project_quota_describe',
      toolId: 'ai_video_broll_generation_wan',
      command: 'gcloud',
      args: ['compute', 'project-info', 'describe', '--project', 'reeditpro', '--format=json'],
      purpose: 'read project-level GPUS_ALL_REGIONS quota without requesting quota',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'broll_region_quota_describe',
      toolId: 'ai_video_broll_generation_wan',
      command: 'gcloud',
      args: ['compute', 'regions', 'describe', 'us-central1', '--project', 'reeditpro', '--format=json'],
      purpose: 'read regional NVIDIA_L4_GPUS quota without creating resources',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
  ] satisfies ExternalAgentToolBlockerPreflightCommand[],
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

export type ExternalAgentToolBlockerPreflight = typeof EXTERNAL_AGENT_TOOL_BLOCKER_PREFLIGHT
