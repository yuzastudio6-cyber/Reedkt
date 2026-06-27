export type Qwen25VlPrivateInvokeConfigMode =
  'qwen2_5_vl_cloud_run_gpu_private_invoke_config_contract'

export type Qwen25VlPrivateInvokeAuthMode =
  'google_signed_identity_token_backend_only'

export interface Qwen25VlPrivateInvokeConfigCandidate {
  project: string
  region: string
  service: string
  authMode: Qwen25VlPrivateInvokeAuthMode
  audienceResolvedByBackendOnly: boolean
  serviceUrlResolvedByBackendOnly: boolean
  serviceUrlValueStoredInRepo: boolean
  invocationEnabledNow: boolean
  retriesEnabledNow: boolean
  timeoutMs: number
  maxBodyBytes: number
}

export interface Qwen25VlPrivateInvokeConfigValidationResult {
  ok: boolean
  acceptedForFutureRuntimeConfig: boolean
  invocationAllowedNow: false
  issues: string[]
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT = {
  mode: 'qwen2_5_vl_cloud_run_gpu_private_invoke_config_contract' as Qwen25VlPrivateInvokeConfigMode,
  targetService: {
    project: 'reeditpro',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    runtimeIdentity: 'reeditpro-stg-gpu-worker-sa@reeditpro.iam.gserviceaccount.com'
  },
  allowedBackendConfigKeys: [
    'QWEN25_VL_CLOUD_RUN_PROJECT',
    'QWEN25_VL_CLOUD_RUN_REGION',
    'QWEN25_VL_CLOUD_RUN_SERVICE',
    'QWEN25_VL_CLOUD_RUN_AUDIENCE_SOURCE',
    'QWEN25_VL_CLOUD_RUN_TIMEOUT_MS',
    'QWEN25_VL_CLOUD_RUN_MAX_BODY_BYTES',
    'QWEN25_VL_CLOUD_RUN_INVOCATION_ENABLED'
  ],
  forbiddenConfigValues: [
    'concrete_service_url',
    'checked_in_identity_token',
    'checked_in_key_material',
    'public_invocation_flag',
    'frontend_exposed_runtime_config',
    'provider_or_billing_credentials'
  ],
  requiredCandidateDefaults: {
    authMode: 'google_signed_identity_token_backend_only' as Qwen25VlPrivateInvokeAuthMode,
    audienceResolvedByBackendOnly: true,
    serviceUrlResolvedByBackendOnly: true,
    serviceUrlValueStoredInRepo: false,
    invocationEnabledNow: false,
    retriesEnabledNow: false,
    timeoutMs: 300000,
    maxBodyBytes: 65536
  },
  runtimeFlags: {
    configContractDefined: true,
    backendOnlyConfig: true,
    configValuesReadNow: false,
    serviceUrlStoredInRepo: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    cloudRunInvocationAttempted: false,
    invocationEnabledNow: false
  }
} as const

export function createQwen25VlPrivateInvokeConfigCandidate(
  overrides: Partial<Qwen25VlPrivateInvokeConfigCandidate> = {}
): Qwen25VlPrivateInvokeConfigCandidate {
  return {
    project: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.targetService.project,
    region: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.targetService.region,
    service: QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.targetService.service,
    authMode:
      QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.requiredCandidateDefaults.authMode,
    audienceResolvedByBackendOnly: true,
    serviceUrlResolvedByBackendOnly: true,
    serviceUrlValueStoredInRepo: false,
    invocationEnabledNow: false,
    retriesEnabledNow: false,
    timeoutMs:
      QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.requiredCandidateDefaults.timeoutMs,
    maxBodyBytes:
      QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT.requiredCandidateDefaults.maxBodyBytes,
    ...overrides
  }
}

export function validateQwen25VlPrivateInvokeConfigCandidate(
  candidate: Qwen25VlPrivateInvokeConfigCandidate
): Qwen25VlPrivateInvokeConfigValidationResult {
  const issues: string[] = []
  const expected = QWEN2_5_VL_CLOUD_RUN_GPU_PRIVATE_INVOKE_CONFIG_CONTRACT

  if (candidate.project !== expected.targetService.project) issues.push('project_mismatch')
  if (candidate.region !== expected.targetService.region) issues.push('region_mismatch')
  if (candidate.service !== expected.targetService.service) issues.push('service_mismatch')
  if (candidate.authMode !== expected.requiredCandidateDefaults.authMode) issues.push('auth_mode_mismatch')
  if (!candidate.audienceResolvedByBackendOnly) issues.push('audience_must_be_backend_resolved')
  if (!candidate.serviceUrlResolvedByBackendOnly) issues.push('service_url_must_be_backend_resolved')
  if (candidate.serviceUrlValueStoredInRepo) issues.push('service_url_value_must_not_be_stored')
  if (candidate.invocationEnabledNow) issues.push('invocation_must_stay_disabled')
  if (candidate.retriesEnabledNow) issues.push('retries_must_stay_disabled')
  if (candidate.timeoutMs <= 0 || candidate.timeoutMs > expected.requiredCandidateDefaults.timeoutMs) {
    issues.push('timeout_out_of_bounds')
  }
  if (candidate.maxBodyBytes !== expected.requiredCandidateDefaults.maxBodyBytes) {
    issues.push('max_body_bytes_mismatch')
  }

  return {
    ok: issues.length === 0,
    acceptedForFutureRuntimeConfig: issues.length === 0,
    invocationAllowedNow: false,
    issues
  }
}
