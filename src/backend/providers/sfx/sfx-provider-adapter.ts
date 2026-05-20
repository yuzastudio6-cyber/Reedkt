import { getSFXProviderConfig } from './sfx-provider-config'
import type {
  SFXProviderGenerateRequest,
  SFXProviderIntegrationMode,
  SFXProviderResult,
} from './sfx-provider-contracts'
import { isMMAudioProviderKey, normalizeSFXProviderKey } from './sfx-provider-contracts'
import { searchInternalSFXLibraryProvider } from './internal-library'
import { generateMockMireloSFX, generateRealMireloSFXPlaceholder, buildMireloRequestFromSFXProviderRequest } from './mirelo'
import { generateMockMMAudioSFX, generateRealMMAudioPlaceholder, buildMMAudioRequestFromSFXProviderRequest } from './mmaudio'

export function generateSFXWithProvider(
  request: SFXProviderGenerateRequest,
  options: { mode?: SFXProviderIntegrationMode } = {},
): SFXProviderResult {
  const providerKey = normalizeSFXProviderKey(request.providerKey)
  const normalizedRequest = {
    ...request,
    providerKey,
  }
  const config = getSFXProviderConfig({
    mode: options.mode,
    mireloModelName: providerKey === 'mirelo_sfx_v1_5' ? request.modelName : undefined,
    mmaudioModelName: isMMAudioProviderKey(request.providerKey) ? request.modelName : undefined,
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

  if (providerKey === 'no_sfx') {
    return {
      ok: false,
      error: {
        code: 'SFX_NO_PROVIDER_SELECTED',
        message: 'No SFX provider selected; no generation should run.',
      },
      warnings: ['No SFX is a valid professional choice.'],
    }
  }

  if (providerKey === 'reeditpro_internal_library') {
    return searchInternalSFXLibraryProvider(normalizedRequest)
  }

  if (providerKey === 'mirelo_sfx_v1_5') {
    const mireloRequest = buildMireloRequestFromSFXProviderRequest(normalizedRequest)
    return config.mode === 'real'
      ? generateRealMireloSFXPlaceholder(mireloRequest)
      : generateMockMireloSFX(mireloRequest)
  }

  if (isMMAudioProviderKey(providerKey)) {
    const mmaudioRequest = buildMMAudioRequestFromSFXProviderRequest(normalizedRequest)
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
