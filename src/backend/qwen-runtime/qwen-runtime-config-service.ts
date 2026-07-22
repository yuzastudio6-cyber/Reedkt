import {
  REEDITPRO_QWEN_MAIN_BRAIN_LABEL,
  REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME,
  type QwenRuntimeConfig,
  type QwenRuntimeSafetyFlags,
  type QwenRuntimeTransportProfile,
} from '../../types'
import { parseCanonicalGoogleSecretManagerReference } from '../../types/canonical-google-secret-manager-reference'

export const QWEN_REASONING_API_KEY_SECRET = 'QWEN_REASONING_API_KEY_SECRET'
export const QWEN_REASONING_API_KEY = 'QWEN_REASONING_API_KEY'
export const QWEN_REASONING_BASE_URL_SECRET = 'QWEN_REASONING_BASE_URL_SECRET'
export const QWEN_REASONING_MODEL_ID_SECRET = 'QWEN_REASONING_MODEL_ID_SECRET'
export const QWEN_RUNTIME_CONFIG_SECRET = 'QWEN_RUNTIME_CONFIG_SECRET'

export const QWEN_BETA_RUNTIME_SAFETY_FLAGS: QwenRuntimeSafetyFlags = {
  providerCallMade: false,
  modelCallMade: false,
  qwenCallMade: false,
  deepSeekCallMade: false,
  gcloudCommandRun: false,
  secretValuePrinted: false,
  secretSentToFrontend: false,
  authorizationHeaderLogged: false,
  supabaseCommandRun: false,
  supabaseReadMade: false,
  supabaseWriteMade: false,
  storageReadMade: false,
  storageWriteMade: false,
  signedUrlCreated: false,
  fileBytesRead: false,
  externalUrlFetched: false,
  mediaProcessingStarted: false,
  soundRuntimeInvoked: false,
  workerJobCreated: false,
  generationRequestCreated: false,
  renderJobCreated: false,
  editPlanCreated: false,
  plannerExecuted: false,
  creditReservedOrSpent: false,
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function parseTransportProfile(value: string | undefined): QwenRuntimeTransportProfile {
  return value === 'generic_json_post' ? 'generic_json_post' : 'openai_chat_completions'
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.min(parsed, max)
}

function requestPathFor(profile: QwenRuntimeTransportProfile, env: Record<string, string | undefined>): string {
  const configured = clean(env.QWEN_REASONING_REQUEST_PATH)
  if (configured?.startsWith('/')) return configured
  if (configured) return `/${configured}`
  return profile === 'openai_chat_completions' ? '/v1/chat/completions' : '/v1/qwen/reasoning'
}

export function createQwenRuntimeSafetyFlags(input: Partial<Pick<QwenRuntimeSafetyFlags, 'providerCallMade' | 'modelCallMade' | 'qwenCallMade'>> = {}): QwenRuntimeSafetyFlags {
  return {
    ...QWEN_BETA_RUNTIME_SAFETY_FLAGS,
    providerCallMade: input.providerCallMade ?? false,
    modelCallMade: input.modelCallMade ?? false,
    qwenCallMade: input.qwenCallMade ?? false,
  }
}

export function loadQwenRuntimeConfig(env: Record<string, string | undefined> = process.env): QwenRuntimeConfig {
  const runtimeMode = clean(env.REEDITPRO_QWEN_RUNTIME_MODE) === 'beta_enabled' ? 'beta_enabled' : 'disabled'
  const transportProfile = parseTransportProfile(clean(env.QWEN_REASONING_TRANSPORT_PROFILE))
  const apiKeyDirectEnvConfigured = Boolean(clean(env[QWEN_REASONING_API_KEY]))
  const apiKeySecretReferenceName = clean(env[QWEN_REASONING_API_KEY_SECRET])
  const apiKeySecretReference = parseCanonicalGoogleSecretManagerReference(apiKeySecretReferenceName)
  const apiKeySecretReferencePinned = apiKeySecretReference.ok
  const apiKeyConfigured = apiKeyDirectEnvConfigured || Boolean(apiKeySecretReferenceName)
  const baseUrlSecretReferenceName = clean(env[QWEN_REASONING_BASE_URL_SECRET])
  const modelIdSecretReferenceName = clean(env[QWEN_REASONING_MODEL_ID_SECRET])
  const legacyRuntimeConfigSecretReferenceName = clean(env[QWEN_RUNTIME_CONFIG_SECRET])
  const projectIdConfigured = Boolean(clean(env.GOOGLE_CLOUD_PROJECT_ID) ?? clean(env.GCLOUD_PROJECT) ?? clean(env.GOOGLE_CLOUD_PROJECT))
  const baseUrlConfigured = Boolean(clean(env.QWEN_REASONING_BASE_URL) ?? baseUrlSecretReferenceName)
  const modelIdConfigured = Boolean(clean(env.QWEN_REASONING_MODEL_ID) ?? modelIdSecretReferenceName)
  const warnings: string[] = []

  if (runtimeMode !== 'beta_enabled') warnings.push('REEDITPRO_QWEN_RUNTIME_MODE is not beta_enabled; deterministic fallback remains active.')
  if (!apiKeyConfigured) warnings.push('QWEN_REASONING_API_KEY_SECRET or backend-only QWEN_REASONING_API_KEY is not configured.')
  if (apiKeySecretReferenceName && !apiKeySecretReferencePinned) warnings.push('QWEN_REASONING_API_KEY_SECRET must be an explicit projects/.../secrets/.../versions/<positive number> reference.')
  if (apiKeyDirectEnvConfigured) warnings.push('QWEN_REASONING_API_KEY direct-env input is local/internal compatibility only and cannot qualify production.')
  if (!baseUrlConfigured) warnings.push('Qwen base URL is not configured.')
  if (!modelIdConfigured) warnings.push('Qwen model ID is not configured.')

  const status = runtimeMode !== 'beta_enabled'
    ? 'blocked_missing_beta_flag'
    : !apiKeyConfigured
      ? 'blocked_missing_secret_reference'
      : apiKeySecretReferenceName && !apiKeySecretReferencePinned && !apiKeyDirectEnvConfigured
        ? 'blocked_unpinned_secret_version'
      : !baseUrlConfigured
        ? 'blocked_missing_base_url'
      : !modelIdConfigured
        ? 'blocked_missing_model_id'
            : 'ready_for_secret_resolution'

  return {
    providerName: REEDITPRO_QWEN_MAIN_BRAIN_PROVIDER_NAME,
    role: 'reasoning_brain',
    runtimeMode,
    status,
    transportProfile,
    projectIdConfigured,
    apiKeyConfigured,
    apiKeyDirectEnvConfigured,
    apiKeySecretReferenceName,
    apiKeySecretReferencePinned,
    baseUrlSecretReferenceName,
    modelIdSecretReferenceName,
    legacyRuntimeConfigSecretReferenceName,
    baseUrlConfigured,
    modelIdConfigured,
    requestPath: requestPathFor(transportProfile, env),
    timeoutMs: parsePositiveInt(env.QWEN_REASONING_TIMEOUT_MS, 12000, 60000),
    maxRetries: parsePositiveInt(env.QWEN_REASONING_MAX_RETRIES, 1, 2),
    fallbackMode: 'deterministic_marker_chat',
    warnings,
  }
}

export function isQwenRuntimeConfigReadyForProvider(config: QwenRuntimeConfig): boolean {
  return config.runtimeMode === 'beta_enabled' && config.status === 'ready_for_secret_resolution'
}

export function createQwenRuntimeConfigSummary(config: QwenRuntimeConfig): string {
  return `${REEDITPRO_QWEN_MAIN_BRAIN_LABEL} beta runtime ${config.status}; mode ${config.runtimeMode}; transport ${config.transportProfile}; provider calls require Secret Manager resolution and structured validation.`
}
