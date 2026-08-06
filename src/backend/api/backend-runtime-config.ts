import type { BackendRuntimeMode } from './api-runtime-contracts'

export type BackendApiTransportMode = 'direct' | 'google_api_gateway'

export interface BackendRuntimeStatus {
  mode: BackendRuntimeMode
  transport: BackendApiTransportMode
  configuredApiBaseUrl?: string
  hasBackendUrl: boolean
  configurationValid: boolean
  mockOnly: boolean
  message: string
  warnings: string[]
}

const SAFE_RUNTIME_MODES: BackendRuntimeMode[] = [
  'mock',
  'frontend_safe',
  'backend_required',
  'cloud_run',
  'supabase_edge_function',
  'serverless',
  'worker',
]

type RuntimeEnvRecord = Record<string, string | undefined>

type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: RuntimeEnvRecord
  }
}

function getViteEnvValue(key: string): string | undefined {
  const viteEnv = (import.meta as ImportMeta & { env?: RuntimeEnvRecord }).env
  const processEnv = (globalThis as RuntimeGlobal).process?.env
  const env = viteEnv ?? processEnv ?? {}
  const value = env[key]?.trim()
  return value && value.length > 0 ? value : undefined
}

export function getBackendRuntimeMode(): BackendRuntimeMode {
  const configuredMode = getViteEnvValue('VITE_REEDITPRO_API_MODE')

  if (configuredMode && SAFE_RUNTIME_MODES.includes(configuredMode as BackendRuntimeMode)) {
    return configuredMode as BackendRuntimeMode
  }

  return 'mock'
}

export function getBackendApiBaseUrl(): string | undefined {
  const configured = getViteEnvValue('VITE_REEDITPRO_API_BASE_URL')
  if (!configured) return undefined

  try {
    const url = new URL(configured)
    const loopbackHttp = url.protocol === 'http:' && isLoopbackHostname(url.hostname)
    const secure = url.protocol === 'https:' || loopbackHttp
    if (
      !secure ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      return undefined
    }
    return url.origin
  } catch {
    return undefined
  }
}

export function getBackendApiTransportMode(): BackendApiTransportMode {
  return getViteEnvValue('VITE_REEDITPRO_API_TRANSPORT') === 'google_api_gateway'
    ? 'google_api_gateway'
    : 'direct'
}

export function isBackendApiTransportConfigurationValid(): boolean {
  const configured = getViteEnvValue('VITE_REEDITPRO_API_TRANSPORT')
  return configured === undefined || configured === 'direct' || configured === 'google_api_gateway'
}

export function isMockRuntime(): boolean {
  return getBackendRuntimeMode() === 'mock'
}

export function isFrontendSafeRuntime(): boolean {
  return getBackendRuntimeMode() === 'frontend_safe'
}

export function isBackendRuntimeRequired(mode: BackendRuntimeMode = getBackendRuntimeMode()): boolean {
  return mode !== 'mock' && mode !== 'frontend_safe'
}

export function getBackendRuntimeWarnings(): string[] {
  const mode = getBackendRuntimeMode()
  const transport = getBackendApiTransportMode()
  const transportConfigurationValid = isBackendApiTransportConfigurationValid()
  const configuredBaseUrl = getViteEnvValue('VITE_REEDITPRO_API_BASE_URL')
  const baseUrl = getBackendApiBaseUrl()

  if (mode === 'mock') {
    return ['Backend API runtime defaults to mock mode; no live route calls will run.']
  }

  if (!transportConfigurationValid) {
    return ['The configured backend API transport mode is unknown; authenticated HTTP transport is disabled.']
  }

  if (!baseUrl) {
    if (configuredBaseUrl) {
      return ['The configured backend API URL is unsafe or malformed; authenticated HTTP transport is disabled.']
    }
    return ['No public API base URL is configured; live backend transport is disabled.']
  }

  if (transport === 'google_api_gateway' && mode !== 'cloud_run') {
    return ['Google API Gateway transport requires VITE_REEDITPRO_API_MODE=cloud_run; authenticated HTTP transport is disabled.']
  }

  return [transport === 'google_api_gateway'
    ? 'Backend API uses the reviewed Google API Gateway transport; user JWTs are duplicated only into the dedicated backend revalidation header.'
    : 'Backend API base URL is configured; reviewed frontend-safe /v1 routes may use direct HTTP transport while backend-required routes stay gated.']
}

export function getBackendRuntimeStatus(): BackendRuntimeStatus {
  const mode = getBackendRuntimeMode()
  const transport = getBackendApiTransportMode()
  const transportConfigurationValid = isBackendApiTransportConfigurationValid()
  const configuredBaseUrlValue = getViteEnvValue('VITE_REEDITPRO_API_BASE_URL')
  const configuredApiBaseUrl = getBackendApiBaseUrl()
  const hasBackendUrl = Boolean(configuredApiBaseUrl)
  const configurationValid = Boolean(
    hasBackendUrl &&
    transportConfigurationValid &&
    (!configuredBaseUrlValue || configuredApiBaseUrl) &&
    (transport !== 'google_api_gateway' || mode === 'cloud_run'),
  )
  const mockOnly = mode === 'mock' || !configurationValid

  return {
    mode,
    transport,
    configuredApiBaseUrl,
    hasBackendUrl,
    configurationValid,
    mockOnly,
    message: mockOnly
      ? 'Backend API is running in mock-safe mode.'
      : 'Backend API public base URL is configured for reviewed frontend-safe HTTP transport.',
    warnings: getBackendRuntimeWarnings(),
  }
}

function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'
}

export function assertBackendRuntimeAvailable(): BackendRuntimeStatus {
  const status = getBackendRuntimeStatus()

  if (status.mockOnly) {
    return {
      ...status,
      warnings: [
        ...status.warnings,
        'Backend-required routes must stay blocked until a reviewed backend runtime is deployed.',
      ],
    }
  }

  return status
}
