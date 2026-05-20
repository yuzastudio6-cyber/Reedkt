import type {
  SFXProviderConfig,
  SFXProviderIntegrationMode,
  SFXProviderKey,
  SFXProviderOutputFormat,
  SFXProviderResult,
} from './sfx-provider-contracts'
import { isMMAudioProviderKey } from './sfx-provider-contracts'

function browserRuntime() {
  return typeof window !== 'undefined'
}

function nodeEnv(name: string) {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[name]
}

function viteEnv(name: string) {
  return (import.meta as { env?: Record<string, string | boolean | undefined> }).env?.[name]
}

function readEnv(name: string) {
  if (browserRuntime()) return undefined
  const value = nodeEnv(name) ?? viteEnv(name)
  return typeof value === 'string' ? value : undefined
}

function normalizeMode(value?: string): SFXProviderIntegrationMode {
  if (value === 'disabled' || value === 'real' || value === 'mock') return value
  return 'mock'
}

function normalizeOutputFormat(value?: string): SFXProviderOutputFormat {
  if (value === 'wav' || value === 'mp3') return value
  return 'wav'
}

export function getSFXProviderIntegrationMode(mode?: SFXProviderIntegrationMode): SFXProviderIntegrationMode {
  return mode ?? normalizeMode(readEnv('SFX_PROVIDER_INTEGRATION_MODE'))
}

export function getMireloModelName(modelName?: string): string {
  return modelName ?? readEnv('MIRELO_SFX_MODEL_NAME') ?? 'mirelo-sfx-v1.5'
}

export function getMMAudioModelName(modelName?: string): string {
  return modelName ?? readEnv('MMAUDIO_MODEL_NAME') ?? 'mmaudio-v2'
}

export function getSFXProviderOutputFormat(outputFormat?: SFXProviderOutputFormat): SFXProviderOutputFormat {
  return outputFormat ?? normalizeOutputFormat(readEnv('SFX_PROVIDER_OUTPUT_FORMAT'))
}

export function isSFXProviderRealModeBlockedInFrontend(): boolean {
  return browserRuntime()
}

export function getSFXProviderConfig(input: {
  mode?: SFXProviderIntegrationMode
  mireloModelName?: string
  mmaudioModelName?: string
  outputFormat?: SFXProviderOutputFormat
} = {}): SFXProviderConfig {
  const isBrowserRuntime = browserRuntime()
  const mireloSecretReferenceName = !isBrowserRuntime ? readEnv('GOOGLE_SECRET_MIRELO_API_KEY_NAME') : undefined
  const mmaudioSecretReferenceName = !isBrowserRuntime ? readEnv('GOOGLE_SECRET_MMAUDIO_API_KEY_NAME') : undefined

  return {
    mode: getSFXProviderIntegrationMode(input.mode),
    mireloModelName: getMireloModelName(input.mireloModelName),
    mmaudioModelName: getMMAudioModelName(input.mmaudioModelName),
    outputFormat: getSFXProviderOutputFormat(input.outputFormat),
    isBrowserRuntime,
    hasMireloCredential: !isBrowserRuntime && Boolean(readEnv('MIRELO_API_KEY') || mireloSecretReferenceName),
    hasMMAudioCredential: !isBrowserRuntime && Boolean(readEnv('MMAUDIO_API_KEY') || mmaudioSecretReferenceName),
    mireloSecretReferenceName,
    mmaudioSecretReferenceName,
  }
}

function hasCredentialForProvider(config: SFXProviderConfig, providerKey: SFXProviderKey) {
  if (providerKey === 'mirelo_sfx_v1_5') return Boolean(config.mireloSecretReferenceName)
  if (isMMAudioProviderKey(providerKey)) return Boolean(config.mmaudioSecretReferenceName)
  if (providerKey === 'reeditpro_internal_library') return true
  return false
}

export function assertSFXRealModeAllowed(
  config: SFXProviderConfig,
  providerKey: SFXProviderKey,
): SFXProviderResult {
  if (config.mode !== 'real') {
    return { ok: true, warnings: ['Real SFX provider mode is not active.'] }
  }

  if (config.isBrowserRuntime) {
    return {
      ok: false,
      error: {
        code: 'SFX_REAL_MODE_FRONTEND_BLOCKED',
        message: 'Real SFX provider calls must never run in the frontend or Vite/browser runtime.',
      },
    }
  }

  if (!hasCredentialForProvider(config, providerKey)) {
    return {
      ok: false,
      error: {
        code: 'SFX_REAL_MODE_CREDENTIALS_MISSING',
        message: 'Real SFX provider mode is blocked because no secure backend credential reference is configured.',
      },
    }
  }

  return {
    ok: false,
    error: {
      code: 'SFX_REAL_CLIENT_NOT_IMPLEMENTED',
      message: 'Real SFX provider clients are intentionally not implemented in this mock-safe milestone.',
    },
    warnings: ['A future backend worker may add real provider SDK or REST transport here.'],
  }
}
