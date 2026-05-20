import type { BackendRuntimeMode } from './api-runtime-contracts'

export interface BackendRuntimeStatus {
  mode: BackendRuntimeMode
  configuredApiBaseUrl?: string
  hasBackendUrl: boolean
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

function getViteEnvValue(key: string): string | undefined {
  const env = import.meta.env as Record<string, string | undefined>
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
  return getViteEnvValue('VITE_REEDITPRO_API_BASE_URL')
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
  const baseUrl = getBackendApiBaseUrl()

  if (mode === 'mock') {
    return ['Backend API runtime defaults to mock mode; no live route calls will run.']
  }

  if (!baseUrl) {
    return ['No public API base URL is configured; live backend transport is disabled.']
  }

  return ['Backend API base URL is configured, but RP-FIX-08 keeps real transport behind a future implementation gate.']
}

export function getBackendRuntimeStatus(): BackendRuntimeStatus {
  const mode = getBackendRuntimeMode()
  const configuredApiBaseUrl = getBackendApiBaseUrl()
  const hasBackendUrl = Boolean(configuredApiBaseUrl)
  const mockOnly = mode === 'mock' || !hasBackendUrl

  return {
    mode,
    configuredApiBaseUrl,
    hasBackendUrl,
    mockOnly,
    message: mockOnly
      ? 'Backend API is running in mock-safe mode.'
      : 'Backend API public base URL is configured for a future transport layer.',
    warnings: getBackendRuntimeWarnings(),
  }
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
