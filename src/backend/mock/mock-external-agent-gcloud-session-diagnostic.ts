export type ExternalAgentGcloudSessionDiagnosticCommand = {
  id: string
  command: string
  args: string[]
  purpose: string
  capturesTokenValue: false
  mutatesCloud: false
  runsInference: false
}

export const EXTERNAL_AGENT_GCLOUD_SESSION_DIAGNOSTIC = {
  decision: 'external_agent_gcloud_session_diagnostic_read_only_probe_defined',
  mode: 'read_only_external_agent_gcloud_session_diagnostic',
  projectId: 'reeditpro',
  qwen: {
    toolId: 'qwen2_5_vl_7b_instruct',
    serviceName: 'reeditpro-qwen2-5-vl-l4-worker',
    callerJobName: 'reeditpro-qwen2-5-vl-private-caller',
    region: 'us-central1',
    blockerIfFailed: 'local_gcloud_reauthentication_required',
    likelyMismatchIfFailed:
      'the refreshed auth is not visible to this Codex shell, active gcloud configuration, or active account',
    nextActionIfBlocked:
      'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-USER: refresh the active local gcloud account/configuration used by this shell, then rerun npm run external-agent-tool-blockers:preflight',
    nextActionIfCleared:
      'QWEN2_5_VL_STACK_TOOL_58DQ-AUTH-REFRESH-VERIFY: record refreshed read-only gcloud auth/service/job readiness, no inference/no mutation',
  },
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
      id: 'gcloud_version',
      command: 'gcloud',
      args: ['--version'],
      purpose: 'read local gcloud version without changing configuration',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_configurations_list',
      command: 'gcloud',
      args: ['config', 'configurations', 'list', '--format=json'],
      purpose: 'read configuration names and active configuration status',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_config_list',
      command: 'gcloud',
      args: ['config', 'list', '--format=json'],
      purpose: 'read active configuration values with account values redacted',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_info',
      command: 'gcloud',
      args: ['info', '--format=json'],
      purpose:
        'read local SDK root, config paths, release channel, and active configuration fingerprint with account values redacted',
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
    {
      id: 'gcloud_account',
      command: 'gcloud',
      args: ['config', 'get-value', 'account'],
      purpose: 'read active account metadata without printing the account value',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_auth_active_account',
      command: 'gcloud',
      args: ['auth', 'list', '--filter=status:ACTIVE', '--format=json'],
      purpose: 'read active auth record metadata with account values redacted',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
    {
      id: 'gcloud_access_token_refresh_suppressed',
      command: 'gcloud',
      args: ['auth', 'print-access-token', '--quiet'],
      purpose: 'verify non-interactive token refresh while suppressing token stdout',
      capturesTokenValue: false,
      mutatesCloud: false,
      runsInference: false,
    },
  ] satisfies ExternalAgentGcloudSessionDiagnosticCommand[],
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

export type ExternalAgentGcloudSessionDiagnostic = typeof EXTERNAL_AGENT_GCLOUD_SESSION_DIAGNOSTIC
