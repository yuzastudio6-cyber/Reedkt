import {
  QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS,
  QWEN25_PRIVATE_INVOKE_AUTH_TARGET,
} from './qwen2-5-vl-cloud-run-gpu-private-invoke-auth-preflight'

export const QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT = {
  mode: 'qwen2_5_vl_private_invoke_auth_reverify_result_blocked_gcloud_reauth_no_invocation',
  runId: 'qwen25-private-invoke-auth-20260627T074548',
  status: 'blocked',
  target: QWEN25_PRIVATE_INVOKE_AUTH_TARGET,
  verifiedToolState: {
    gcloudVersionChecked: true,
    gcloudVersion: 'Google Cloud SDK 558.0.0',
    activeProjectVerified: true,
    activeProject: 'reeditpro',
    activeAccountPresent: true,
    activeAccountValueStored: false,
    activeAccountDomain: 'reeditpro.com',
  },
  passedProbeIds: [
    'gcloud_version',
    'active_project',
    'active_account',
  ],
  blockedProbeIds: [
    'cloud_run_service_describe',
    'cloud_run_service_iam_policy',
    'runtime_service_account_describe',
    'project_invoker_policy_read',
  ],
  blockedReason: 'gcloud_auth_session_requires_interactive_reauthentication',
  blockerMessages: [
    'Cloud Run service describe blocked by non-interactive gcloud reauthentication.',
    'Cloud Run service IAM policy read blocked by non-interactive gcloud reauthentication.',
    'Runtime service account describe blocked by non-interactive gcloud reauthentication.',
    'Project invoker policy read blocked by non-interactive gcloud reauthentication.',
  ],
  resultSummary: [
    'The guarded runner executed only read-only gcloud version, project, account, Cloud Run, and IAM describe probes.',
    'gcloud version, active project, and active account checks passed.',
    'Cloud Run and IAM describe probes remain blocked by non-interactive gcloud reauthentication.',
    'No identity token was fetched and Cloud Run was not invoked.',
  ],
  runtimeFlags: QWEN25_PRIVATE_INVOKE_AUTH_RUNTIME_FLAGS,
  qwenRuntimeReadiness: {
    privateInvocationAuthVerified: false,
    cloudRunServiceDescribeVerified: false,
    cloudRunIamPolicyVerified: false,
    runtimeServiceAccountVerified: false,
    projectInvokerPolicyVerified: false,
    readyForPrivateInvocationSmoke: false,
    betaProductionReadyClaimed: false,
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_50-GCLOUD-REAUTH-USER: refresh local gcloud auth outside Codex, no token/no invocation',
} as const

export type Qwen25PrivateInvokeAuthReverifyResult =
  typeof QWEN25_PRIVATE_INVOKE_AUTH_REVERIFY_RESULT
