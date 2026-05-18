import type {
  LyriaIntegrationMode,
  LyriaModelName,
  LyriaOutputMimeType,
  LyriaProviderConfig,
  LyriaProviderResult,
} from './lyria-provider-contracts'

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

function normalizeMode(value?: string): LyriaIntegrationMode {
  if (value === 'disabled' || value === 'real' || value === 'mock') return value
  return 'mock'
}

function normalizeModel(value?: string): LyriaModelName {
  if (value === 'lyria-3-clip-preview') return value
  return 'lyria-3-pro-preview'
}

function normalizeMime(value?: string): LyriaOutputMimeType {
  if (value === 'audio/mpeg' || value === 'audio/mp3' || value === 'audio/wav') return value
  return 'audio/wav'
}

export function getLyriaIntegrationMode(mode?: LyriaIntegrationMode): LyriaIntegrationMode {
  return mode ?? normalizeMode(readEnv('LYRIA_INTEGRATION_MODE'))
}

export function getLyriaModelName(modelName?: LyriaModelName): LyriaModelName {
  return modelName ?? normalizeModel(readEnv('LYRIA_MODEL_NAME'))
}

export function getLyriaOutputMimeType(outputMimeType?: LyriaOutputMimeType): LyriaOutputMimeType {
  return outputMimeType ?? normalizeMime(readEnv('LYRIA_OUTPUT_MIME_TYPE'))
}

export function getLyriaProviderConfig(input: {
  mode?: LyriaIntegrationMode
  modelName?: LyriaModelName
  outputMimeType?: LyriaOutputMimeType
} = {}): LyriaProviderConfig {
  const isBrowserRuntime = browserRuntime()
  return {
    mode: getLyriaIntegrationMode(input.mode),
    modelName: getLyriaModelName(input.modelName),
    outputMimeType: getLyriaOutputMimeType(input.outputMimeType),
    isBrowserRuntime,
    hasApiKey: !isBrowserRuntime && Boolean(readEnv('GOOGLE_GENAI_API_KEY')),
    secretReferenceName: !isBrowserRuntime ? readEnv('GOOGLE_SECRET_LYRIA_API_KEY_NAME') : undefined,
  }
}

export function assertLyriaRealModeAllowed(config: LyriaProviderConfig): LyriaProviderResult {
  if (config.mode !== 'real') {
    return { ok: true, warnings: ['Real Lyria mode is not active.'] }
  }

  if (config.isBrowserRuntime) {
    return {
      ok: false,
      error: {
        code: 'LYRIA_REAL_MODE_FRONTEND_BLOCKED',
        message: 'Real Lyria calls must never run in the frontend or Vite/browser runtime.',
      },
    }
  }

  if (!config.hasApiKey && !config.secretReferenceName) {
    return {
      ok: false,
      error: {
        code: 'LYRIA_REAL_MODE_CREDENTIALS_MISSING',
        message: 'Real Lyria mode is blocked because no secure backend credential reference is configured.',
      },
    }
  }

  return {
    ok: false,
    error: {
      code: 'LYRIA_REAL_CLIENT_NOT_IMPLEMENTED',
      message: 'Real Lyria client is intentionally not implemented in this mock-safe milestone.',
    },
    warnings: ['A future backend worker may add the Google GenAI SDK or REST call here.'],
  }
}
