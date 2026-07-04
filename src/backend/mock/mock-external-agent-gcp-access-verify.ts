import { EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN } from './mock-external-agent-gcp-access-repair-plan'

export const EXTERNAL_AGENT_GCP_ACCESS_VERIFY = {
  decision: 'external_agent_gcp_access_verify_read_only_probe_defined',
  mode: 'read_only_external_agent_gcp_access_verify',
  projectId: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.projectId,
  accountSelection: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.accountSelection,
  requiredRepairPlanCommand: 'npm run external-agent-gcp-access:repair-plan',
  livePreflightCommand: 'npm run external-agent-tool-blockers:preflight',
  liveNextCommand: 'npm run external-agent-tool-next-command',
  accountAccessDiagnosticCommand: 'npm run external-agent-gcloud-account-access:diagnostic',
  qwen: {
    toolId: 'qwen2_5_vl_7b_instruct',
    requiredReadPermissions: ['run.services.get', 'run.jobs.get'],
    requiredLiveFields: ['accessTokenRefreshPassed', 'serviceDescribePassed', 'jobDescribePassed'],
    wrapperCommand: 'npm run external-agent-tool-execute-qwen -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_QWEN_EXECUTION',
  },
  broll: {
    toolId: 'ai_video_broll_generation_wan',
    requiredReadPermissions: ['compute.projects.get', 'compute.regions.get'],
    requiredLiveFields: ['projectQuotaReadPassed', 'regionQuotaReadPassed', 'quotaSufficientForOneL4Vm'],
    wrapperCommand: 'npm run external-agent-tool-execute-broll-wan -- --execute --json',
    confirmationEnv: 'REEDITPRO_CONFIRM_EXTERNAL_AGENT_BROLL_WAN_PROOF',
  },
  runtimeSideEffects: EXTERNAL_AGENT_GCP_ACCESS_REPAIR_PLAN.runtimeSideEffects,
  recommendedNextPromptIfAccessBlocked:
    'QWEN2_5_VL_STACK_TOOL_58DQ-GCP-ACCESS-REPAIR: grant/read-select local gcloud account access, then rerun npm run external-agent-gcp-access:verify',
  recommendedNextPromptIfVerified:
    'EXTERNAL-AGENT-TOOL-EXECUTION-RETRY: rerun npm run external-agent-tool-next-command and use emitted guarded wrapper only if executionAllowedNow=true',
} as const

export type ExternalAgentGcpAccessVerify = typeof EXTERNAL_AGENT_GCP_ACCESS_VERIFY
