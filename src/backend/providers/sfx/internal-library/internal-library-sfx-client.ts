import { nowIso } from '../../../mock/mock-database'
import type {
  SFXProviderGenerateRequest,
  SFXProviderResult,
} from '../sfx-provider-contracts'
import { parseSFXProviderResponse } from '../sfx-provider-response-parser'

function matchedLibraryAssetId(request: SFXProviderGenerateRequest) {
  const fromMetadata = request.metadata?.matchedLibraryAssetId
  return typeof fromMetadata === 'string' && fromMetadata.length > 0 ? fromMetadata : undefined
}

export function createInternalLibrarySFXProviderResponse(input: {
  request: SFXProviderGenerateRequest
  matchedLibraryAssetId: string
}): SFXProviderResult {
  const mockStoragePath = `mock://internal-sfx-library/${input.matchedLibraryAssetId}.wav`
  const parsed = parseSFXProviderResponse({
    rawResponse: {
      matchedLibraryAssetId: input.matchedLibraryAssetId,
      parts: [
        {
          text: `Approved internal SFX library match ${input.matchedLibraryAssetId} selected.`,
        },
        {
          type: 'audio',
          mimeType: input.request.outputFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav',
          data: null,
        },
      ],
    },
    providerKey: 'reeditpro_internal_library',
    providerName: 'ReeditPro Internal Library',
    modelName: input.request.modelName ?? 'reeditpro-internal-sfx-library',
    durationSeconds: input.request.durationSeconds,
    outputFormat: input.request.outputFormat === 'mp3' ? 'mp3' : 'wav',
    mockStoragePath,
    mockOnly: true,
  })

  return {
    ok: true,
    response: {
      ...parsed.response,
      generatedAt: nowIso(),
    },
    warnings: [
      'Internal SFX library match used. No provider generation was attempted.',
      ...parsed.warnings,
    ],
  }
}

export function searchInternalSFXLibraryProvider(request: SFXProviderGenerateRequest): SFXProviderResult {
  const matchId = matchedLibraryAssetId(request)

  if (!matchId) {
    return {
      ok: false,
      error: {
        code: 'SFX_INTERNAL_LIBRARY_NO_MATCH',
        message: 'No approved internal SFX library match was supplied for this mock provider request.',
      },
      warnings: ['Internal library returned no match; a fallback provider is required before generation can continue.'],
    }
  }

  return createInternalLibrarySFXProviderResponse({
    request,
    matchedLibraryAssetId: matchId,
  })
}
