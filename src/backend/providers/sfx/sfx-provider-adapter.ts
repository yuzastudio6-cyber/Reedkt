import { getSFXProviderConfig } from './sfx-provider-config'
import type {
  SFXProviderGenerateRequest,
  SFXProviderIntegrationMode,
  SFXProviderResult,
} from './sfx-provider-contracts'
import { searchInternalSFXLibraryProvider } from './internal-library'
import { generateMockMireloSFX, generateRealMireloSFXPlaceholder, buildMireloRequestFromSFXProviderRequest } from './mirelo'
import { generateMockMMAudioSFX, generateRealMMAudioPlaceholder, buildMMAudioRequestFromSFXProviderRequest } from './mmaudio'

export function generateSFXWithProvider(
  request: SFXProviderGenerateRequest,
  options: { mode?: SFXProviderIntegrationMode } = {},
): SFXProviderResult {
  const config = getSFXProviderConfig({
    mode: options.mode,
    mireloModelName: request.providerKey === 'mirelo_sfx_v1_5' ? request.modelName : undefined,
    mmaudioModelName: request.providerKey === 'mmaudio_v' ? request.modelName : undefined,
    outputFormat: request.outputFormat,
  })

  if (config.mode === 'disabled') {
    return {
      ok: false,
      error: {
        code: 'SFX_PROVIDER_INTEGRATION_DISABLED',
        message: 'SFX provider integration disabled.',
      },
      warnings: ['No mock or real SFX provider generation was attempted.'],
    }
  }

  if (request.providerKey === 'no_sfx') {
    return {
      ok: false,
      error: {
        code: 'SFX_NO_PROVIDER_SELECTED',
        message: 'No SFX provider selected; no generation should run.',
      },
      warnings: ['No SFX is a valid professional choice.'],
    }
  }

  if (request.providerKey === 'reeditpro_internal_library') {
    return searchInternalSFXLibraryProvider(request)
  }

  if (request.providerKey === 'mirelo_sfx_v1_5') {
    const mireloRequest = buildMireloRequestFromSFXProviderRequest(request)
    return config.mode === 'real'
      ? generateRealMireloSFXPlaceholder(mireloRequest)
      : generateMockMireloSFX(mireloRequest)
  }

  if (request.providerKey === 'mmaudio_v') {
    const mmaudioRequest = buildMMAudioRequestFromSFXProviderRequest(request)
    return config.mode === 'real'
      ? generateRealMMAudioPlaceholder(mmaudioRequest)
      : generateMockMMAudioSFX(mmaudioRequest)
  }

  return {
    ok: false,
    error: {
      code: 'SFX_PROVIDER_UNSUPPORTED',
      message: 'SFX provider key is not supported by the mock adapter.',
      details: { providerKey: request.providerKey },
    },
  }
}
